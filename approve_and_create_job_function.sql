-- Função para aprovar solicitação e criar vaga diretamente
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
    
    -- Depois, criar a vaga
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
            'active',
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
GRANT EXECUTE ON FUNCTION public.approve_and_create_job(text, text) TO authenticated; 