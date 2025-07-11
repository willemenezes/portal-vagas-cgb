-- Função corrigida com cast explícito para contract_type
CREATE OR REPLACE FUNCTION public.create_job_from_request(request_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    req_data record;
    job_id uuid;
BEGIN
    -- Buscar dados da solicitação aprovada
    SELECT * INTO req_data 
    FROM public.job_requests 
    WHERE id::text = request_id AND status = 'aprovado';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitação não encontrada ou não aprovada';
    END IF;
    
    -- Inserir nova vaga com cast explícito para contract_type
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
    
    -- Log da criação
    RAISE NOTICE 'Vaga criada com ID: %', job_id;
    
    RETURN job_id;
END;
$function$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.create_job_from_request(text) TO authenticated; 