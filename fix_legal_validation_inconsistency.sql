-- Script para corrigir inconsistência entre status do candidato e review_status jurídico
-- Execute este script no Supabase para corrigir candidatos reprovados que ainda têm review_status = 'approved'

-- 1. Verificar candidatos com inconsistência
SELECT 
    c.id,
    c.name,
    c.status as candidate_status,
    cld.review_status as legal_review_status,
    cld.review_notes,
    cld.reviewed_at
FROM candidates c
LEFT JOIN candidate_legal_data cld ON c.id = cld.candidate_id
WHERE c.status = 'Reprovado' 
  AND cld.review_status = 'approved'
ORDER BY c.updated_at DESC;

-- 2. Contar quantos candidatos precisam de correção
SELECT 
    COUNT(*) as total_candidatos_inconsistentes
FROM candidates c
LEFT JOIN candidate_legal_data cld ON c.id = cld.candidate_id
WHERE c.status = 'Reprovado' 
  AND cld.review_status = 'approved';

-- 3. Corrigir os dados inconsistentes (execute APÓS verificar os resultados acima)
/*
UPDATE candidate_legal_data 
SET 
    review_status = 'rejected',
    reviewed_at = NOW()
WHERE candidate_id IN (
    SELECT c.id 
    FROM candidates c
    WHERE c.status = 'Reprovado'
) 
AND review_status = 'approved';
*/

-- 4. Verificar o resultado após a correção
SELECT 
    c.id,
    c.name,
    c.status as candidate_status,
    cld.review_status as legal_review_status,
    cld.reviewed_at
FROM candidates c
LEFT JOIN candidate_legal_data cld ON c.id = cld.candidate_id
WHERE c.status = 'Reprovado'
ORDER BY c.updated_at DESC
LIMIT 10;

