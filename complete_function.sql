CREATE OR REPLACE FUNCTION public.create_job_from_request(request_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    req_data record;
    job_id uuid;
BEGIN
    SELECT * INTO req_data 
    FROM public.job_requests 
    WHERE id::text = request_id AND status = 'aprovado';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitacao nao encontrada ou nao aprovada';
    END IF;
    
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
        'CLT',
        req_data.description,
        req_data.requirements,
        req_data.benefits,
        req_data.workload,
        'aprovacao_pendente',
        'active',
        auth.uid()
    ) RETURNING id INTO job_id;
    
    RETURN job_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_job_from_request(text) TO authenticated; 