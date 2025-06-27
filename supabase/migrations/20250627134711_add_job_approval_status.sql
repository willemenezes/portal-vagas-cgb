-- Create a new ENUM type for job approval statuses
CREATE TYPE public.job_approval_status AS ENUM (
    'rascunho',
    'aprovacao_pendente',
    'ativo',
    'rejeitado',
    'fechado'
);

-- Add the new column to the jobs table
ALTER TABLE public.jobs
ADD COLUMN approval_status public.job_approval_status DEFAULT 'rascunho';

-- Optional: Update existing jobs to a default status if needed
-- For example, set all current jobs to 'active'
UPDATE public.jobs
SET approval_status = 'ativo';
