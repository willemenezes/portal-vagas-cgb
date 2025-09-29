-- Correção da função create_job_from_request para incluir todos os campos necessários
-- Esta migração corrige o erro PGRST203 que estava ocorrendo

-- Remover a função existente para evitar conflitos
DROP FUNCTION IF EXISTS public.create_job_from_request(uuid);
DROP FUNCTION IF EXISTS public.create_job_from_request(text);

-- Recriar a função com todos os campos necessários
CREATE OR REPLACE FUNCTION public.create_job_from_request(request_id uuid)
RETURNS uuid AS $$
DECLARE
    request_data record;
    new_job_id uuid;
BEGIN
    -- Get the approved request data
    SELECT * INTO request_data 
    FROM public.job_requests 
    WHERE id = request_id AND status = 'aprovado';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitação não encontrada ou não aprovada';
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
        request_data.approved_by,
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
COMMENT ON FUNCTION public.create_job_from_request(uuid) IS 'Cria uma nova vaga a partir de uma solicitação aprovada, incluindo todos os campos necessários (quantity, expires_at, flow_status, etc.)';
