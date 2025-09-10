-- Corrigir tabela job_requests - adicionar campo solicitante_nome que estava faltando
-- Execute este script no Supabase SQL Editor

-- Adicionar campo solicitante_nome na tabela job_requests
ALTER TABLE public.job_requests 
ADD COLUMN IF NOT EXISTS solicitante_nome VARCHAR(100);

-- Adicionar campo observacoes_internas na tabela job_requests (também estava faltando)
ALTER TABLE public.job_requests 
ADD COLUMN IF NOT EXISTS observacoes_internas TEXT;

-- Comentários para documentar as colunas
COMMENT ON COLUMN public.job_requests.solicitante_nome IS 'Nome do solicitante para controle interno';
COMMENT ON COLUMN public.job_requests.observacoes_internas IS 'Observações internas para controle';

-- Verificar se todas as colunas foram adicionadas corretamente
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'job_requests' 
AND column_name IN ('solicitante_nome', 'solicitante_funcao', 'observacoes_internas', 'tipo_solicitacao', 'nome_substituido')
ORDER BY column_name;
