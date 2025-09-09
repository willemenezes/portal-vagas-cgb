-- Atualizar função create_job_from_request para incluir quantity e expires_at
-- Executar em: https://supabase.com/dashboard/project/csgmamxhqkqdknohfsfj/sql

CREATE OR REPLACE FUNCTION public.create_job_from_request(request_id text)
RETURNS uuid AS $$
DECLARE
    request_data record;
    new_job_id uuid;
BEGIN
    -- Buscar dados da solicitação aprovada
    SELECT * INTO request_data 
    FROM public.job_requests 
    WHERE id::text = request_id AND status = 'aprovado';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitação não encontrada ou não aprovada';
    END IF;
    
    -- Criar nova vaga
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
        expires_at
    ) VALUES (
        request_data.title,
        request_data.department,
        request_data.city, 
        request_data.state,
        request_data.type,
        request_data.description,
        request_data.requirements,
        request_data.benefits,
        request_data.workload,
        'ativo',
        'active',
        request_data.approved_by::uuid,
        COALESCE(request_data.quantity, 1),
        NOW() + INTERVAL '20 days' -- 20 dias corridos para contratação
    ) RETURNING id INTO new_job_id;
    
    RETURN new_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
