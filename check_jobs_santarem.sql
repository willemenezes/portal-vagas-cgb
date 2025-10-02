-- Verificar vagas em Santarém (onde a Bettsy deveria ver)
SELECT 
    id,
    title,
    city,
    state,
    flow_status,
    status,
    created_at
FROM jobs 
WHERE (flow_status = 'ativa' OR flow_status IS NULL)
  AND city = 'Santarém' 
  AND state = 'PA'
ORDER BY created_at DESC;
