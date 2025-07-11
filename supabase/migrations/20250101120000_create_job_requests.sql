-- Create ENUM type for job request statuses
CREATE TYPE public.job_request_status AS ENUM (
    'pendente',
    'aprovado', 
    'rejeitado'
);

-- Create job_requests table
CREATE TABLE public.job_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    department text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    type text DEFAULT 'CLT',
    description text NOT NULL,
    requirements text[], -- Array de strings
    benefits text[], -- Array de strings  
    workload text DEFAULT '40h/semana',
    status job_request_status DEFAULT 'pendente',
    requested_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_by_name text, -- Nome do solicitante para facilitar consultas
    notes text, -- Notas da gerência sobre aprovação/rejeição
    approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Quem aprovou/rejeitou
    approved_at timestamp with time zone, -- Quando foi aprovado/rejeitado
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_job_requests_status ON public.job_requests(status);
CREATE INDEX idx_job_requests_requested_by ON public.job_requests(requested_by);
CREATE INDEX idx_job_requests_created_at ON public.job_requests(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.job_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Solicitadores podem ver apenas suas próprias solicitações
CREATE POLICY "Solicitadores podem ver suas próprias solicitações" ON public.job_requests
    FOR SELECT USING (
        auth.uid() = requested_by OR 
        EXISTS (
            SELECT 1 FROM public.rh_users 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'gerente')
        )
    );

-- Solicitadores podem criar solicitações
CREATE POLICY "Solicitadores podem criar solicitações" ON public.job_requests
    FOR INSERT WITH CHECK (
        auth.uid() = requested_by AND
        EXISTS (
            SELECT 1 FROM public.rh_users 
            WHERE user_id = auth.uid() 
            AND role IN ('solicitador', 'admin', 'gerente')
        )
    );

-- Apenas gerentes e admins podem atualizar status das solicitações
CREATE POLICY "Gerentes podem aprovar/rejeitar solicitações" ON public.job_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.rh_users 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'gerente')
        )
    );

-- Solicitadores podem editar suas próprias solicitações (apenas se status = 'pendente')
CREATE POLICY "Solicitadores podem editar solicitações pendentes" ON public.job_requests
    FOR UPDATE USING (
        auth.uid() = requested_by AND 
        status = 'pendente' AND
        EXISTS (
            SELECT 1 FROM public.rh_users 
            WHERE user_id = auth.uid() 
            AND role IN ('solicitador', 'admin', 'gerente')
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_job_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_job_requests_updated_at
    BEFORE UPDATE ON public.job_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_job_requests_updated_at();

-- Function to create job from approved request
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
        'ativo', -- Já aprovado
        'active', -- Ativo para candidaturas
        request_data.approved_by
    ) RETURNING id INTO new_job_id;
    
    RETURN new_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.job_requests TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 