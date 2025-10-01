-- Script para atualizar manualmente o campo company_contract
-- Execute este script no SQL Editor do Supabase

-- 1. Atualizar o registro do Janilton com o contrato
UPDATE public.candidate_legal_data 
SET company_contract = 'CT 02.152',
    updated_at = NOW()
WHERE candidate_id = (
    SELECT id FROM public.candidates 
    WHERE name ILIKE '%Janilton%' 
    LIMIT 1
);

-- 2. Verificar se foi atualizado
SELECT 
    cld.id,
    c.name as candidato,
    cld.company_contract,
    cld.updated_at
FROM public.candidate_legal_data cld
JOIN public.candidates c ON cld.candidate_id = c.id
WHERE c.name ILIKE '%Janilton%';

-- 3. Verificar todos os registros atualizados recentemente
SELECT 
    cld.id,
    c.name as candidato,
    cld.company_contract,
    cld.updated_at
FROM public.candidate_legal_data cld
JOIN public.candidates c ON cld.candidate_id = c.id
WHERE cld.updated_at > NOW() - INTERVAL '1 hour'
ORDER BY cld.updated_at DESC;
