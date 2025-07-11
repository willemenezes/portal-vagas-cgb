-- Verificar novamente os valores válidos do enum job_approval_status
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
    SELECT oid FROM pg_type WHERE typname = 'job_approval_status'
) ORDER BY enumlabel;

-- Verificar também se existe outro enum relacionado
SELECT typname FROM pg_type WHERE typname LIKE '%approval%' OR typname LIKE '%status%';

-- Função corrigida usando um dos valores que vimos anteriormente: 'rascunho'
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
        'rascunho',  -- Usar valor que sabemos que existe
        'active',
        auth.uid()
    ) RETURNING id INTO job_id;
    
    RETURN job_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_job_from_request(text) TO authenticated; 