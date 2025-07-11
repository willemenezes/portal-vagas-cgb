-- Verificar o status atual do candidato Edgar
SELECT id, name, status, email
FROM candidates
WHERE name LIKE '%Edgar%'
ORDER BY created_at DESC;

-- Se necessário, atualizar para "Validação TJ"
-- UPDATE candidates 
-- SET status = 'Validação TJ'
-- WHERE name = 'Edgar Macêdo Oliveira'; 