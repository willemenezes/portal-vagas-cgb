-- Corrigir função create_job_from_request com valores corretos em inglês
CREATE OR REPLACE FUNCTION public.create_job_from_request(request_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    req_data record;
    job_id uuid;
BEGIN
    RAISE NOTICE 'Iniciando criação de vaga para request_id: %', request_id;
    
    -- Buscar dados da solicitação aprovada
    SELECT * INTO req_data 
    FROM public.job_requests 
    WHERE id::text = request_id AND status = 'aprovado' AND job_created = FALSE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitação não encontrada, não aprovada ou vaga já foi criada para ID: %', request_id;
    END IF;
    
    RAISE NOTICE 'Dados encontrados - Title: %, Department: %, Type: %', req_data.title, req_data.department, req_data.type;
    
    -- Inserir nova vaga com approval_status active
    BEGIN
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
            created_by
        ) VALUES (
            req_data.title,
            req_data.department,
            req_data.city,
            req_data.state,
            COALESCE(req_data.type, 'CLT')::contract_type,
            req_data.description,
            req_data.requirements,
            req_data.benefits,
            req_data.workload,
            'active',  -- Status de aprovação ativo (em inglês)
            'active',  -- Status para candidaturas
            auth.uid()
        ) RETURNING id INTO job_id;
        
        -- Marcar a solicitação como vaga criada
        UPDATE public.job_requests 
        SET job_created = TRUE, updated_at = NOW()
        WHERE id::text = request_id;
        
        RAISE NOTICE 'Vaga criada com sucesso - ID: %', job_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao inserir vaga: % - SQLSTATE: %', SQLERRM, SQLSTATE;
    END;
    
    RETURN job_id;
END;
$function$;

-- Corrigir função approve_and_create_job também
CREATE OR REPLACE FUNCTION public.approve_and_create_job(request_id text, approval_notes text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    req_data record;
    job_id uuid;
BEGIN
    RAISE NOTICE 'Aprovando e criando vaga para request_id: %', request_id;
    
    -- Buscar dados da solicitação pendente
    SELECT * INTO req_data 
    FROM public.job_requests 
    WHERE id::text = request_id AND status = 'pendente';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitação não encontrada ou não está pendente para ID: %', request_id;
    END IF;
    
    -- Primeiro, aprovar a solicitação
    UPDATE public.job_requests 
    SET 
        status = 'aprovado',
        notes = approval_notes,
        approved_by = auth.uid()::text,
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id::text = request_id;
    
    RAISE NOTICE 'Solicitação aprovada - Title: %, Department: %, Type: %', req_data.title, req_data.department, req_data.type;
    
    -- Depois, criar a vaga com status active
    BEGIN
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
            created_by
        ) VALUES (
            req_data.title,
            req_data.department,
            req_data.city,
            req_data.state,
            COALESCE(req_data.type, 'CLT')::contract_type,
            req_data.description,
            req_data.requirements,
            req_data.benefits,
            req_data.workload,
            'active',  -- Status de aprovação ativo (em inglês)
            'active',  -- Status para candidaturas
            auth.uid()
        ) RETURNING id INTO job_id;
        
        -- Marcar a solicitação como vaga criada
        UPDATE public.job_requests 
        SET job_created = TRUE, updated_at = NOW()
        WHERE id::text = request_id;
        
        RAISE NOTICE 'Vaga criada diretamente com sucesso - ID: %', job_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao criar vaga: % - SQLSTATE: %', SQLERRM, SQLSTATE;
    END;
    
    RETURN job_id;
END;
$function$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.create_job_from_request(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_and_create_job(text, text) TO authenticated; 