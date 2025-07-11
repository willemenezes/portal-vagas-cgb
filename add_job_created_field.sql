-- Adicionar campo para indicar se a vaga já foi criada
ALTER TABLE public.job_requests 
ADD COLUMN IF NOT EXISTS job_created BOOLEAN DEFAULT FALSE;

-- Atualizar a função para marcar quando a vaga é criada
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
    
    -- Inserir nova vaga
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
        
        RAISE NOTICE 'Vaga criada com sucesso - ID: %', job_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao inserir vaga: % - SQLSTATE: %', SQLERRM, SQLSTATE;
    END;
    
    RETURN job_id;
END;
$function$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.create_job_from_request(text) TO authenticated; 