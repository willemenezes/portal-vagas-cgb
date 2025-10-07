-- Script para verificar como os dados de validação jurídica estão sendo salvos
-- Execute este script para entender a estrutura atual

-- 1. Verificar todos os candidatos com status relacionado a validação
SELECT 
    c.id,
    c.name,
    c.status as candidate_status,
    c.legal_validation_comment,
    cld.review_status as legal_review_status,
    cld.review_notes,
    cld.reviewed_at
FROM candidates c
LEFT JOIN candidate_legal_data cld ON c.id = cld.candidate_id
WHERE c.status ILIKE '%validação%' OR c.status ILIKE '%frota%'
ORDER BY c.updated_at DESC
LIMIT 10;

-- 2. Verificar todos os dados jurídicos existentes
SELECT 
    cld.candidate_id,
    c.name,
    cld.review_status,
    cld.review_notes,
    cld.reviewed_at
FROM candidate_legal_data cld
LEFT JOIN candidates c ON cld.candidate_id = c.id
ORDER BY cld.reviewed_at DESC
LIMIT 10;

-- 3. Verificar candidatos que estão na fase "Validação Frota"
SELECT 
    c.id,
    c.name,
    c.status,
    c.legal_validation_comment,
    cld.review_status,
    cld.review_notes
FROM candidates c
LEFT JOIN candidate_legal_data cld ON c.id = cld.candidate_id
WHERE c.status = 'Validação Frota'
ORDER BY c.updated_at DESC;

