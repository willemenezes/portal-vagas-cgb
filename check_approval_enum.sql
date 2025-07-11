-- Verificar os valores do enum de status de aprovação do trabalho
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
    SELECT oid FROM pg_type WHERE typname = '_status_de_aprovação_do_trabalho'
) ORDER BY enumlabel;

-- Se não encontrar, tentar sem o underscore
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
    SELECT oid FROM pg_type WHERE typname = 'status_de_aprovação_do_trabalho'
) ORDER BY enumlabel;

-- Verificar também a estrutura da tabela jobs para ver o tipo exato da coluna approval_status
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'jobs' AND column_name = 'approval_status';

-- Função simplificada sem usar o enum problemático
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
    
    -- Inserir sem especificar approval_status (deixar o padrão)
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
        'CLT',
        req_data.description,
        req_data.requirements,
        req_data.benefits,
        req_data.workload,
        'active',
        auth.uid()
    ) RETURNING id INTO job_id;
    
    RETURN job_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_job_from_request(text) TO authenticated; 