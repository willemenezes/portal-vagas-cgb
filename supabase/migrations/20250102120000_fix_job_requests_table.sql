-- Verificar se a tabela job_requests existe e adicionar campos que podem estar faltando
DO $$ 
BEGIN
    -- Verificar se a tabela existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_requests') THEN
        -- Se não existe, criar a tabela completa
        CREATE TYPE public.job_request_status AS ENUM (
            'pendente',
            'aprovado', 
            'rejeitado'
        );

        CREATE TABLE public.job_requests (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            title text NOT NULL,
            department text NOT NULL,
            city text NOT NULL,
            state text NOT NULL,
            type text DEFAULT 'CLT',
            description text NOT NULL,
            requirements text[], 
            benefits text[],  
            workload text DEFAULT '40h/semana',
            status job_request_status DEFAULT 'pendente',
            requested_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
            requested_by_name text,
            notes text,
            approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
            approved_at timestamp with time zone,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );

        -- Criar índices
        CREATE INDEX idx_job_requests_status ON public.job_requests(status);
        CREATE INDEX idx_job_requests_requested_by ON public.job_requests(requested_by);
        CREATE INDEX idx_job_requests_created_at ON public.job_requests(created_at);

        -- Enable RLS
        ALTER TABLE public.job_requests ENABLE ROW LEVEL SECURITY;
    ELSE
        -- Se a tabela existe, verificar e adicionar campos que podem estar faltando
        
        -- Adicionar requested_by_name se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'job_requests' AND column_name = 'requested_by_name') THEN
            ALTER TABLE public.job_requests ADD COLUMN requested_by_name text;
        END IF;

        -- Adicionar notes se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'job_requests' AND column_name = 'notes') THEN
            ALTER TABLE public.job_requests ADD COLUMN notes text;
        END IF;

        -- Adicionar approved_by se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'job_requests' AND column_name = 'approved_by') THEN
            ALTER TABLE public.job_requests ADD COLUMN approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;

        -- Adicionar approved_at se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'job_requests' AND column_name = 'approved_at') THEN
            ALTER TABLE public.job_requests ADD COLUMN approved_at timestamp with time zone;
        END IF;
    END IF;

    -- Verificar se o enum existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_request_status') THEN
        CREATE TYPE public.job_request_status AS ENUM (
            'pendente',
            'aprovado', 
            'rejeitado'
        );
    END IF;

    -- Verificar se a coluna status tem o tipo correto
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'job_requests' AND column_name = 'status' AND data_type != 'USER-DEFINED') THEN
        -- Alterar o tipo da coluna status se necessário
        ALTER TABLE public.job_requests ALTER COLUMN status TYPE job_request_status USING status::job_request_status;
    END IF;
END $$;

-- Criar políticas RLS se não existirem
DO $$
BEGIN
    -- Política para SELECT
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'job_requests' AND policyname = 'Solicitadores podem ver suas próprias solicitações') THEN
        CREATE POLICY "Solicitadores podem ver suas próprias solicitações" ON public.job_requests
            FOR SELECT USING (
                auth.uid() = requested_by OR 
                EXISTS (
                    SELECT 1 FROM public.rh_users 
                    WHERE user_id = auth.uid() 
                    AND role IN ('admin', 'gerente')
                )
            );
    END IF;

    -- Política para INSERT
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'job_requests' AND policyname = 'Solicitadores podem criar solicitações') THEN
        CREATE POLICY "Solicitadores podem criar solicitações" ON public.job_requests
            FOR INSERT WITH CHECK (
                auth.uid() = requested_by AND
                EXISTS (
                    SELECT 1 FROM public.rh_users 
                    WHERE user_id = auth.uid() 
                    AND role IN ('solicitador', 'admin', 'gerente')
                )
            );
    END IF;

    -- Política para UPDATE (gerentes)
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'job_requests' AND policyname = 'Gerentes podem aprovar/rejeitar solicitações') THEN
        CREATE POLICY "Gerentes podem aprovar/rejeitar solicitações" ON public.job_requests
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.rh_users 
                    WHERE user_id = auth.uid() 
                    AND role IN ('admin', 'gerente')
                )
            );
    END IF;

    -- Política para UPDATE (solicitadores)
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'job_requests' AND policyname = 'Solicitadores podem editar solicitações pendentes') THEN
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
    END IF;
END $$;

-- Criar função de update timestamp se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'update_job_requests_updated_at') THEN
        CREATE OR REPLACE FUNCTION public.update_job_requests_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    END IF;
END $$;

-- Criar trigger se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_job_requests_updated_at') THEN
        CREATE TRIGGER update_job_requests_updated_at
            BEFORE UPDATE ON public.job_requests
            FOR EACH ROW
            EXECUTE FUNCTION public.update_job_requests_updated_at();
    END IF;
END $$;

-- Criar função para criar vaga a partir de solicitação se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'create_job_from_request') THEN
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
    END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.job_requests TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 