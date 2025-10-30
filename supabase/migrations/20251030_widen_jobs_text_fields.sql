-- Ampliar campos de texto da tabela jobs para evitar erro "value too long for type character varying(100)"
-- Seguro para produção: apenas altera o tipo para text (sem perda de dados e sem locks longos)

DO $$ BEGIN
    -- Tornar campos potencialmente limitados em text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'title'
    ) THEN
        ALTER TABLE public.jobs ALTER COLUMN title TYPE text;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'department'
    ) THEN
        ALTER TABLE public.jobs ALTER COLUMN department TYPE text;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'city'
    ) THEN
        ALTER TABLE public.jobs ALTER COLUMN city TYPE text;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'state'
    ) THEN
        ALTER TABLE public.jobs ALTER COLUMN state TYPE text;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'workload'
    ) THEN
        ALTER TABLE public.jobs ALTER COLUMN workload TYPE text;
    END IF;

    -- Campos internos adicionados recentemente
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'solicitante_nome'
    ) THEN
        ALTER TABLE public.jobs ALTER COLUMN solicitante_nome TYPE text;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'solicitante_funcao'
    ) THEN
        ALTER TABLE public.jobs ALTER COLUMN solicitante_funcao TYPE text;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'observacoes_internas'
    ) THEN
        ALTER TABLE public.jobs ALTER COLUMN observacoes_internas TYPE text;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'tipo_solicitacao'
    ) THEN
        ALTER TABLE public.jobs ALTER COLUMN tipo_solicitacao TYPE text;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'nome_substituido'
    ) THEN
        ALTER TABLE public.jobs ALTER COLUMN nome_substituido TYPE text;
    END IF;
END $$;

COMMENT ON COLUMN public.jobs.title IS 'Título da vaga (text para permitir descrições mais longas)';


