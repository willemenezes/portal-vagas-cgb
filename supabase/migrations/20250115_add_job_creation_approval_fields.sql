-- Adicionar campos de criação e aprovação na tabela jobs
-- Esta migração adiciona campos para rastrear quem criou e quem aprovou cada vaga

-- Adicionar campos se não existirem
DO $$ 
BEGIN
    -- Campo para armazenar o ID do usuário que criou a vaga
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'created_by') THEN
        ALTER TABLE public.jobs ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Campo para armazenar o nome do usuário que criou a vaga (para facilitar consultas)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'created_by_name') THEN
        ALTER TABLE public.jobs ADD COLUMN created_by_name text;
    END IF;

    -- Campo para armazenar o ID do usuário que aprovou a vaga
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'approved_by') THEN
        ALTER TABLE public.jobs ADD COLUMN approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Campo para armazenar o nome do usuário que aprovou a vaga (para facilitar consultas)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'approved_by_name') THEN
        ALTER TABLE public.jobs ADD COLUMN approved_by_name text;
    END IF;

    -- Campo para armazenar a data de aprovação
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'approved_at') THEN
        ALTER TABLE public.jobs ADD COLUMN approved_at timestamp with time zone;
    END IF;

    -- Campo para indicar se tem justificativa
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'is_justificativa') THEN
        ALTER TABLE public.jobs ADD COLUMN is_justificativa boolean DEFAULT false;
    END IF;

    -- Campo para armazenar a justificativa
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'justification') THEN
        ALTER TABLE public.jobs ADD COLUMN justification text;
    END IF;
END $$;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON public.jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_jobs_approved_by ON public.jobs(approved_by);
CREATE INDEX IF NOT EXISTS idx_jobs_approved_at ON public.jobs(approved_at);

-- Comentários para documentação
COMMENT ON COLUMN public.jobs.created_by IS 'ID do usuário que criou a vaga';
COMMENT ON COLUMN public.jobs.created_by_name IS 'Nome do usuário que criou a vaga (para facilitar consultas)';
COMMENT ON COLUMN public.jobs.approved_by IS 'ID do usuário que aprovou a vaga';
COMMENT ON COLUMN public.jobs.approved_by_name IS 'Nome do usuário que aprovou a vaga (para facilitar consultas)';
COMMENT ON COLUMN public.jobs.approved_at IS 'Data e hora da aprovação da vaga';
COMMENT ON COLUMN public.jobs.is_justificativa IS 'Indica se a vaga possui justificativa';
COMMENT ON COLUMN public.jobs.justification IS 'Texto da justificativa da vaga';

-- Função para atualizar automaticamente os campos de nome quando um job é criado/atualizado
CREATE OR REPLACE FUNCTION public.update_job_user_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar created_by_name se created_by foi definido
    IF NEW.created_by IS NOT NULL THEN
        SELECT name INTO NEW.created_by_name 
        FROM public.rh_users 
        WHERE user_id = NEW.created_by;
    END IF;

    -- Atualizar approved_by_name se approved_by foi definido
    IF NEW.approved_by IS NOT NULL THEN
        SELECT name INTO NEW.approved_by_name 
        FROM public.rh_users 
        WHERE user_id = NEW.approved_by;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar automaticamente os nomes
DROP TRIGGER IF EXISTS update_job_user_names_trigger ON public.jobs;
CREATE TRIGGER update_job_user_names_trigger
    BEFORE INSERT OR UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_job_user_names();

-- Atualizar jobs existentes com dados de criação (se possível)
UPDATE public.jobs 
SET created_by_name = (
    SELECT ru.name 
    FROM public.rh_users ru 
    WHERE ru.user_id = jobs.created_by
)
WHERE created_by IS NOT NULL AND created_by_name IS NULL;

-- Atualizar jobs existentes com dados de aprovação (se possível)
UPDATE public.jobs 
SET approved_by_name = (
    SELECT ru.name 
    FROM public.rh_users ru 
    WHERE ru.user_id = jobs.approved_by
)
WHERE approved_by IS NOT NULL AND approved_by_name IS NULL;
