-- Script para verificar se o campo company_contract está sendo salvo
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a coluna existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'candidate_legal_data' 
AND column_name = 'company_contract';

-- 2. Verificar os dados mais recentes
SELECT 
    cld.id,
    c.name as candidato,
    cld.company_contract,
    cld.desired_position,
    cld.created_at,
    cld.updated_at
FROM public.candidate_legal_data cld
JOIN public.candidates c ON cld.candidate_id = c.id
WHERE c.name ILIKE '%Janilton%'
ORDER BY cld.updated_at DESC
LIMIT 5;

-- 3. Verificar todos os registros com company_contract preenchido
SELECT 
    cld.id,
    c.name as candidato,
    cld.company_contract,
    cld.created_at
FROM public.candidate_legal_data cld
JOIN public.candidates c ON cld.candidate_id = c.id
WHERE cld.company_contract IS NOT NULL
ORDER BY cld.updated_at DESC
LIMIT 10;

-- 4. Contar registros com e sem contrato
SELECT 
    COUNT(*) as total_registros,
    COUNT(company_contract) as com_contrato,
    COUNT(*) - COUNT(company_contract) as sem_contrato
FROM public.candidate_legal_data;
