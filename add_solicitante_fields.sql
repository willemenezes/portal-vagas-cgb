-- Adicionar campos de controle interno para solicitantes
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna para função/contrato do solicitante
ALTER TABLE public.job_requests 
ADD COLUMN IF NOT EXISTS solicitante_funcao VARCHAR(100);

-- Comentário para documentar a coluna
COMMENT ON COLUMN public.job_requests.solicitante_funcao IS 'Função/contrato do solicitante para controle interno';

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'job_requests' 
AND column_name = 'solicitante_funcao';
