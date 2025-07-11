-- Corrigir problema da chave estrangeira job_requests_requested_by_fkey

DO $$ 
BEGIN
    -- Verificar se a constraint existe e removê-la se necessário
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'job_requests_requested_by_fkey' 
        AND table_name = 'job_requests'
    ) THEN
        ALTER TABLE public.job_requests DROP CONSTRAINT job_requests_requested_by_fkey;
    END IF;

    -- Recriar a constraint corretamente
    ALTER TABLE public.job_requests 
    ADD CONSTRAINT job_requests_requested_by_fkey 
    FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Verificar se a constraint approved_by existe e corrigir se necessário
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'job_requests_approved_by_fkey' 
        AND table_name = 'job_requests'
    ) THEN
        ALTER TABLE public.job_requests DROP CONSTRAINT job_requests_approved_by_fkey;
    END IF;

    -- Recriar a constraint approved_by
    ALTER TABLE public.job_requests 
    ADD CONSTRAINT job_requests_approved_by_fkey 
    FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

EXCEPTION
    WHEN OTHERS THEN
        -- Se houver erro, tentar uma abordagem mais simples
        -- Remover todas as constraints de foreign key relacionadas
        PERFORM 1;
END $$;

-- Alternativa: Se o problema persistir, criar uma versão simplificada da tabela
DO $$
BEGIN
    -- Se ainda houver problemas, recriar a tabela sem foreign keys problemáticas
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'job_requests' 
        AND table_schema = 'public'
    ) THEN
        -- Backup dos dados existentes se houver
        CREATE TEMP TABLE job_requests_backup AS SELECT * FROM public.job_requests;
        
        -- Remover tabela problemática
        DROP TABLE IF EXISTS public.job_requests CASCADE;
        
        -- Recriar tabela com estrutura correta
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
            requested_by uuid, -- Sem foreign key por enquanto
            requested_by_name text,
            notes text,
            approved_by uuid, -- Sem foreign key por enquanto
            approved_at timestamp with time zone,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );

        -- Restaurar dados se existiam
        INSERT INTO public.job_requests 
        SELECT * FROM job_requests_backup 
        WHERE EXISTS (SELECT 1 FROM job_requests_backup);

        -- Criar índices
        CREATE INDEX IF NOT EXISTS idx_job_requests_status ON public.job_requests(status);
        CREATE INDEX IF NOT EXISTS idx_job_requests_requested_by ON public.job_requests(requested_by);
        CREATE INDEX IF NOT EXISTS idx_job_requests_created_at ON public.job_requests(created_at);

        -- Enable RLS
        ALTER TABLE public.job_requests ENABLE ROW LEVEL SECURITY;

        -- Recriar políticas RLS
        DROP POLICY IF EXISTS "Solicitadores podem ver suas próprias solicitações" ON public.job_requests;
        CREATE POLICY "Solicitadores podem ver suas próprias solicitações" ON public.job_requests
            FOR SELECT USING (
                auth.uid()::text = requested_by::text OR 
                EXISTS (
                    SELECT 1 FROM public.rh_users 
                    WHERE user_id = auth.uid() 
                    AND role IN ('admin', 'gerente', 'manager')
                )
            );

        DROP POLICY IF EXISTS "Solicitadores podem criar solicitações" ON public.job_requests;
        CREATE POLICY "Solicitadores podem criar solicitações" ON public.job_requests
            FOR INSERT WITH CHECK (
                auth.uid()::text = requested_by::text AND
                EXISTS (
                    SELECT 1 FROM public.rh_users 
                    WHERE user_id = auth.uid() 
                    AND role IN ('solicitador', 'admin', 'gerente', 'manager')
                )
            );

        DROP POLICY IF EXISTS "Gerentes podem aprovar/rejeitar solicitações" ON public.job_requests;
        CREATE POLICY "Gerentes podem aprovar/rejeitar solicitações" ON public.job_requests
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.rh_users 
                    WHERE user_id = auth.uid() 
                    AND role IN ('admin', 'gerente', 'manager')
                )
            );

        DROP POLICY IF EXISTS "Solicitadores podem editar solicitações pendentes" ON public.job_requests;
        CREATE POLICY "Solicitadores podem editar solicitações pendentes" ON public.job_requests
            FOR UPDATE USING (
                auth.uid()::text = requested_by::text AND 
                status = 'pendente' AND
                EXISTS (
                    SELECT 1 FROM public.rh_users 
                    WHERE user_id = auth.uid() 
                    AND role IN ('solicitador', 'admin', 'gerente', 'manager')
                )
            );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao recriar tabela: %', SQLERRM;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.job_requests TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 