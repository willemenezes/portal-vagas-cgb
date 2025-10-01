-- Script para atualizar dados jurídicos existentes
-- Execute este script no SQL Editor do Supabase

-- 1. PRIMEIRO: Adicionar a coluna se ela não existir
ALTER TABLE public.candidate_legal_data
ADD COLUMN IF NOT EXISTS company_contract TEXT;

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_candidate_legal_data_company_contract 
ON public.candidate_legal_data(company_contract);

-- 3. Adicionar comentário na coluna
COMMENT ON COLUMN public.candidate_legal_data.company_contract IS 'Contrato da empresa para o qual o candidato está concorrendo';

-- 4. Verificar estrutura atual
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'candidate_legal_data' 
AND column_name = 'company_contract';

-- 2. Atualizar registros existentes (opcional - definir valor padrão)
-- Descomente a linha abaixo se quiser definir um valor padrão para contratos existentes
-- UPDATE public.candidate_legal_data 
-- SET company_contract = 'Contrato não especificado'
-- WHERE company_contract IS NULL;

-- 3. Verificar resultado
SELECT 
    COUNT(*) as total_registros,
    COUNT(company_contract) as com_contrato,
    COUNT(*) - COUNT(company_contract) as sem_contrato
FROM public.candidate_legal_data;

-- 4. Listar alguns exemplos
SELECT 
    cld.id,
    c.name as candidato,
    cld.company_contract,
    cld.created_at
FROM public.candidate_legal_data cld
JOIN public.candidates c ON cld.candidate_id = c.id
WHERE cld.company_contract IS NOT NULL
ORDER BY cld.created_at DESC
LIMIT 5;
