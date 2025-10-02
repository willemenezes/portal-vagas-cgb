-- Verificar todas as vagas ativas
SELECT 
    id,
    title,
    city,
    state,
    flow_status,
    status,
    created_at
FROM jobs 
WHERE flow_status = 'ativa' OR flow_status IS NULL
ORDER BY created_at DESC;
