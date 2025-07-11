-- Adicionar coluna justification na tabela job_requests
ALTER TABLE public.job_requests 
ADD COLUMN IF NOT EXISTS justification TEXT;

-- Comentário da coluna para documentação
COMMENT ON COLUMN public.job_requests.justification IS 'Justificativa do solicitador para criação da vaga - visível apenas para aprovadores'; 