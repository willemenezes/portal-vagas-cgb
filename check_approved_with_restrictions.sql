-- Script para verificar e corrigir candidatos aprovados com restrições
-- Execute este script para encontrar candidatos que precisam de correção

-- 1. Verificar candidatos que têm legal_validation_comment mas review_status = 'approved'
SELECT 
    c.id,
    c.name,
    c.status as candidate_status,
    c.legal_validation_comment,
    cld.review_status as legal_review_status,
    cld.review_notes
FROM candidates c
LEFT JOIN candidate_legal_data cld ON c.id = cld.candidate_id
WHERE c.legal_validation_comment IS NOT NULL 
  AND c.legal_validation_comment != ''
  AND cld.review_status = 'approved'
ORDER BY c.updated_at DESC;

-- 2. Verificar candidatos que têm review_status = 'approved_with_restrictions'
SELECT 
    c.id,
    c.name,
    c.status as candidate_status,
    c.legal_validation_comment,
    cld.review_status as legal_review_status,
    cld.review_notes
FROM candidates c
LEFT JOIN candidate_legal_data cld ON c.id = cld.candidate_id
WHERE cld.review_status = 'approved_with_restrictions'
ORDER BY c.updated_at DESC;

-- 3. Contar quantos candidatos precisam de correção
SELECT 
    COUNT(*) as candidatos_com_restricoes_mas_approved
FROM candidates c
LEFT JOIN candidate_legal_data cld ON c.id = cld.candidate_id
WHERE c.legal_validation_comment IS NOT NULL 
  AND c.legal_validation_comment != ''
  AND cld.review_status = 'approved';

-- 4. Corrigir os dados inconsistentes (execute APÓS verificar os resultados acima)
/*
UPDATE candidate_legal_data 
SET 
    review_status = 'approved_with_restrictions',
    reviewed_at = NOW()
WHERE candidate_id IN (
    SELECT c.id 
    FROM candidates c
    WHERE c.legal_validation_comment IS NOT NULL 
      AND c.legal_validation_comment != ''
) 
AND review_status = 'approved';
*/

-- 5. Verificar o resultado após a correção
SELECT 
    c.id,
    c.name,
    c.status as candidate_status,
    c.legal_validation_comment,
    cld.review_status as legal_review_status
FROM candidates c
LEFT JOIN candidate_legal_data cld ON c.id = cld.candidate_id
WHERE cld.review_status = 'approved_with_restrictions'
ORDER BY c.updated_at DESC
LIMIT 10;

