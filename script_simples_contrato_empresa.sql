-- SCRIPT SIMPLES PARA ADICIONAR CAMPO CONTRATO DA EMPRESA
-- Execute este script completo no SQL Editor do Supabase

-- PASSO 1: Adicionar a coluna company_contract
ALTER TABLE public.candidate_legal_data
ADD COLUMN IF NOT EXISTS company_contract TEXT;

-- PASSO 2: Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_candidate_legal_data_company_contract 
ON public.candidate_legal_data(company_contract);

-- PASSO 3: Adicionar comentário
COMMENT ON COLUMN public.candidate_legal_data.company_contract IS 'Contrato da empresa para o qual o candidato está concorrendo';

-- PASSO 4: Verificar se funcionou
SELECT 
    COUNT(*) as total_registros,
    COUNT(company_contract) as com_contrato,
    COUNT(*) - COUNT(company_contract) as sem_contrato
FROM public.candidate_legal_data;

-- PASSO 5: Mostrar alguns exemplos
SELECT 
    cld.id,
    c.name as candidato,
    cld.company_contract,
    cld.created_at
FROM public.candidate_legal_data cld
JOIN public.candidates c ON cld.candidate_id = c.id
ORDER BY cld.created_at DESC
LIMIT 5;
