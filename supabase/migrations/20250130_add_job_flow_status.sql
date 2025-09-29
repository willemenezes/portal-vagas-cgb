-- Adicionar campo flow_status nas tabelas jobs e job_requests
-- Este campo controla a visibilidade e status do fluxo da vaga

-- 1. Criar ENUM para flow_status
DO $$ BEGIN
    CREATE TYPE job_flow_status AS ENUM ('ativa', 'concluida', 'congelada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Adicionar coluna flow_status na tabela jobs
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS flow_status job_flow_status DEFAULT 'ativa';

-- 3. Adicionar coluna flow_status na tabela job_requests
ALTER TABLE public.job_requests 
ADD COLUMN IF NOT EXISTS flow_status job_flow_status DEFAULT 'ativa';

-- 4. Atualizar vagas existentes para 'ativa'
UPDATE public.jobs 
SET flow_status = 'ativa' 
WHERE flow_status IS NULL;

UPDATE public.job_requests 
SET flow_status = 'ativa' 
WHERE flow_status IS NULL;

-- 5. Criar índice para melhor performance em queries públicas
CREATE INDEX IF NOT EXISTS idx_jobs_flow_status ON public.jobs(flow_status);

-- 6. Comentários para documentação
COMMENT ON COLUMN public.jobs.flow_status IS 'Status do fluxo da vaga: ativa (visível no site), concluida (preenchida), congelada (pausada)';
COMMENT ON COLUMN public.job_requests.flow_status IS 'Status do fluxo da solicitação: ativa (visível no site), concluida (preenchida), congelada (pausada)';

-- 7. Atualizar a função create_job_from_request para incluir flow_status
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
    
    -- Create new job
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
        request_data.type,
        request_data.description,
        request_data.requirements,
        request_data.benefits,
        request_data.workload,
        'active', -- Já aprovado
        'active', -- Ativo para candidaturas
        request_data.approved_by,
        request_data.quantity,
        request_data.expires_at,
        'ativa', -- Vaga começa ativa
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
