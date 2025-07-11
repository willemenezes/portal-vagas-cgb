-- Criar tabela job_requests de forma simples e funcional

-- Remover tabela se existir (para começar limpo)
DROP TABLE IF EXISTS public.job_requests CASCADE;

-- Criar tabela job_requests
CREATE TABLE public.job_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    department text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    type text DEFAULT 'CLT',
    description text NOT NULL,
    requirements text[] DEFAULT '{}',
    benefits text[] DEFAULT '{}',
    workload text DEFAULT '40h/semana',
    status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    requested_by text, -- Usando text ao invés de uuid para evitar problemas de foreign key
    requested_by_name text,
    notes text,
    approved_by text, -- Usando text ao invés de uuid
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_job_requests_status ON public.job_requests(status);
CREATE INDEX idx_job_requests_requested_by ON public.job_requests(requested_by);
CREATE INDEX idx_job_requests_created_at ON public.job_requests(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.job_requests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS simplificadas
CREATE POLICY "Usuários podem ver solicitações" ON public.job_requests
    FOR SELECT USING (
        auth.uid()::text = requested_by OR 
        EXISTS (
            SELECT 1 FROM public.rh_users 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'gerente', 'manager')
        )
    );

CREATE POLICY "Usuários podem criar solicitações" ON public.job_requests
    FOR INSERT WITH CHECK (
        auth.uid()::text = requested_by AND
        EXISTS (
            SELECT 1 FROM public.rh_users 
            WHERE user_id = auth.uid() 
            AND role IN ('solicitador', 'admin', 'gerente', 'manager')
        )
    );

CREATE POLICY "Gerentes podem atualizar solicitações" ON public.job_requests
    FOR UPDATE USING (
        auth.uid()::text = requested_by OR
        EXISTS (
            SELECT 1 FROM public.rh_users 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'gerente', 'manager')
        )
    );

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_job_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp automaticamente
CREATE TRIGGER update_job_requests_updated_at
    BEFORE UPDATE ON public.job_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_job_requests_updated_at();

-- Função para criar vaga a partir de solicitação (simplificada)
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
        created_by
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
        request_data.approved_by::uuid
    ) RETURNING id INTO new_job_id;
    
    RETURN new_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT SELECT, INSERT, UPDATE ON public.job_requests TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_job_from_request(text) TO authenticated; 