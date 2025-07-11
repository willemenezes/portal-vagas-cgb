-- Verificar candidatos em status "Validação TJ"
SELECT 
    c.id,
    c.name,
    c.status,
    c.email
FROM candidates c
WHERE c.status = 'Validação TJ'
ORDER BY c.name;

-- Verificar dados jurídicos coletados
SELECT 
    cld.id,
    cld.candidate_id,
    cld.review_status,
    cld.collected_at,
    c.name as candidate_name
FROM candidate_legal_data cld
JOIN candidates c ON c.id = cld.candidate_id
ORDER BY cld.collected_at DESC;

-- Verificar candidatos com dados para validação jurídica
SELECT 
    c.id,
    c.name,
    c.status,
    cld.id as legal_data_id,
    cld.review_status,
    cld.collected_at
FROM candidates c
LEFT JOIN candidate_legal_data cld ON c.id = cld.candidate_id
WHERE c.status = 'Validação TJ'
ORDER BY c.name; 