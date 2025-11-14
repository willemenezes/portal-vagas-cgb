-- Melhorar a função create_job_from_request com validações mais detalhadas
-- Esta migração melhora as mensagens de erro e validações

CREATE OR REPLACE FUNCTION public.create_job_from_request(request_id uuid)
RETURNS uuid AS $$
DECLARE
    request_data record;
    new_job_id uuid;
    creator_user_id uuid;
BEGIN
    -- Verificar se a solicitação existe
    SELECT * INTO request_data 
    FROM public.job_requests 
    WHERE id = request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitação não encontrada com ID: %', request_id;
    END IF;
    
    -- Verificar se já foi convertida em vaga
    IF request_data.job_created THEN
        RAISE EXCEPTION 'Esta solicitação já foi convertida em vaga anteriormente';
    END IF;
    
    -- Verificar se está aprovada
    IF request_data.status != 'aprovado' THEN
        RAISE EXCEPTION 'A solicitação precisa estar aprovada para criar a vaga. Status atual: %', request_data.status;
    END IF;
    
    -- Resolver o UUID do criador da vaga
    -- approved_by pode ser UUID ou nome (text)
    IF request_data.approved_by IS NOT NULL THEN
        -- Tentar converter para UUID primeiro
        BEGIN
            creator_user_id := request_data.approved_by::uuid;
        EXCEPTION WHEN OTHERS THEN
            -- Se falhar, é porque approved_by é um nome (text)
            -- Buscar o UUID do usuário pelo nome na tabela rh_users
            SELECT user_id INTO creator_user_id
            FROM public.rh_users
            WHERE full_name = request_data.approved_by
            LIMIT 1;
            
            -- Se não encontrar pelo nome, usar o usuário atual
            IF creator_user_id IS NULL THEN
                creator_user_id := auth.uid();
            END IF;
        END;
    ELSE
        -- Se approved_by for NULL, usar o usuário atual
        creator_user_id := auth.uid();
    END IF;
    
    -- Se ainda não tiver UUID, usar o usuário atual como fallback
    IF creator_user_id IS NULL THEN
        creator_user_id := auth.uid();
    END IF;
    
    -- Create new job with all necessary fields
    INSERT INTO public.jobs (
        title,
        department, 
        city,
        state,
        type,
        description,
        requirements,
        benefits,
        workload,
        approval_status,
        status,
        created_by,
        quantity,
        expires_at,
        flow_status,
        solicitante_nome,
        solicitante_funcao,
        observacoes_internas,
        tipo_solicitacao,
        nome_substituido
    ) VALUES (
        request_data.title,
        request_data.department,
        request_data.city, 
        request_data.state,
        request_data.type::contract_type, -- Cast para o tipo ENUM correto
        request_data.description,
        request_data.requirements,
        request_data.benefits,
        request_data.workload,
        'active', -- Já aprovado
        'active', -- Ativo para candidaturas
        creator_user_id, -- UUID do criador resolvido
        COALESCE(request_data.quantity, 1), -- Usar quantidade da solicitação ou padrão 1
        request_data.expires_at, -- Usar data de expiração da solicitação
        COALESCE(request_data.flow_status::job_flow_status, 'ativa'::job_flow_status), -- Cast para job_flow_status
        request_data.solicitante_nome,
        request_data.solicitante_funcao,
        request_data.observacoes_internas,
        request_data.tipo_solicitacao,
        request_data.nome_substituido
    ) RETURNING id INTO new_job_id;
    
    -- Mark request as converted to job
    UPDATE public.job_requests
    SET job_created = true
    WHERE id = request_id;
    
    RETURN new_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.create_job_from_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_job_from_request(uuid) TO service_role;

-- Comentário para documentação
COMMENT ON FUNCTION public.create_job_from_request(uuid) IS 'Cria uma nova vaga a partir de uma solicitação aprovada, incluindo todos os campos necessários (quantity, expires_at, flow_status, etc.). Valida se a solicitação existe, está aprovada e ainda não foi convertida em vaga.';

