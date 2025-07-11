-- Função corrigida para criar vaga a partir de solicitação aprovada
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
    
    -- Criar nova vaga na tabela jobs
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
        created_at,
        updated_at
    ) VALUES (
        request_data.title,
        request_data.department,
        request_data.city, 
        request_data.state,
        request_data.type::contract_type,
        request_data.description,
        request_data.requirements,
        request_data.benefits,
        request_data.workload,
        'ativo',
        'active',
        CASE 
            WHEN request_data.approved_by IS NOT NULL AND request_data.approved_by != '' 
            THEN request_data.approved_by::uuid 
            ELSE auth.uid() 
        END,
        now(),
        now()
    ) RETURNING id INTO new_job_id;
    
    RETURN new_job_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Se houver erro de conversão de tipo, usar CLT como padrão
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
            created_at,
            updated_at
        ) VALUES (
            request_data.title,
            request_data.department,
            request_data.city, 
            request_data.state,
            'CLT'::contract_type,
            request_data.description,
            request_data.requirements,
            request_data.benefits,
            request_data.workload,
            'ativo',
            'active',
            CASE 
                WHEN request_data.approved_by IS NOT NULL AND request_data.approved_by != '' 
                THEN request_data.approved_by::uuid 
                ELSE auth.uid() 
            END,
            now(),
            now()
        ) RETURNING id INTO new_job_id;
        
        RETURN new_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.create_job_from_request(text) TO authenticated; 