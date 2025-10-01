-- Atualizar dados jurídicos existentes para incluir campo company_contract
-- Esta migração adiciona o campo company_contract para candidatos que já têm dados jurídicos

-- 1. Verificar quantos registros existem na tabela candidate_legal_data
SELECT COUNT(*) as total_registros FROM public.candidate_legal_data;

-- 2. Atualizar registros existentes para incluir um valor padrão no campo company_contract
-- (opcional - pode deixar NULL se preferir)
UPDATE public.candidate_legal_data 
SET company_contract = 'Contrato não especificado'
WHERE company_contract IS NULL;

-- 3. Verificar se a atualização foi bem-sucedida
SELECT 
    COUNT(*) as total_registros,
    COUNT(company_contract) as com_contrato,
    COUNT(*) - COUNT(company_contract) as sem_contrato
FROM public.candidate_legal_data;

-- 4. Mostrar alguns exemplos dos dados atualizados
SELECT 
    cld.id,
    c.name as candidato,
    cld.company_contract,
    cld.created_at
FROM public.candidate_legal_data cld
JOIN public.candidates c ON cld.candidate_id = c.id
ORDER BY cld.created_at DESC
LIMIT 10;
