-- Adicionar campos de controle interno para solicitantes
-- Execute este script no Supabase SQL Editor

-- Para tabela job_requests
ALTER TABLE public.job_requests 
ADD COLUMN IF NOT EXISTS solicitante_funcao VARCHAR(100),
ADD COLUMN IF NOT EXISTS tipo_solicitacao VARCHAR(20) DEFAULT 'aumento_quadro',
ADD COLUMN IF NOT EXISTS nome_substituido VARCHAR(100);

-- Para tabela jobs (criação direta pelo RH/Admin)
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS solicitante_nome VARCHAR(100),
ADD COLUMN IF NOT EXISTS solicitante_funcao VARCHAR(100),
ADD COLUMN IF NOT EXISTS observacoes_internas TEXT,
ADD COLUMN IF NOT EXISTS tipo_solicitacao VARCHAR(20) DEFAULT 'aumento_quadro',
ADD COLUMN IF NOT EXISTS nome_substituido VARCHAR(100);

-- Comentários para documentar as colunas
COMMENT ON COLUMN public.job_requests.solicitante_funcao IS 'Função/contrato do solicitante para controle interno';
COMMENT ON COLUMN public.job_requests.tipo_solicitacao IS 'Tipo de solicitação: aumento_quadro, substituicao';
COMMENT ON COLUMN public.job_requests.nome_substituido IS 'Nome da pessoa substituída (quando tipo = substituicao)';

COMMENT ON COLUMN public.jobs.solicitante_nome IS 'Nome do solicitante para controle interno';
COMMENT ON COLUMN public.jobs.solicitante_funcao IS 'Função/contrato do solicitante para controle interno';
COMMENT ON COLUMN public.jobs.observacoes_internas IS 'Observações internas para controle';
COMMENT ON COLUMN public.jobs.tipo_solicitacao IS 'Tipo de solicitação: aumento_quadro, substituicao';
COMMENT ON COLUMN public.jobs.nome_substituido IS 'Nome da pessoa substituída (quando tipo = substituicao)';

-- Verificar se as colunas foram adicionadas
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('job_requests', 'jobs') 
AND column_name IN ('solicitante_funcao', 'tipo_solicitacao', 'nome_substituido', 'solicitante_nome', 'observacoes_internas')
ORDER BY table_name, column_name;
