-- Script para corrigir flow_status das vagas existentes
-- Executar no Supabase SQL Editor

-- 1. Verificar vagas sem flow_status
SELECT 
    id,
    title,
    city,
    state,
    status,
    approval_status,
    flow_status,
    created_at
FROM jobs
WHERE flow_status IS NULL
AND status = 'active'
AND approval_status = 'active'
ORDER BY created_at DESC;

-- 2. Atualizar vagas ativas sem flow_status para 'ativa'
UPDATE jobs
SET flow_status = 'ativa'
WHERE flow_status IS NULL
AND status = 'active'
AND approval_status = 'active';

-- 3. Verificar resultado
SELECT 
    flow_status,
    COUNT(*) as total
FROM jobs
WHERE status = 'active'
AND approval_status = 'active'
GROUP BY flow_status
ORDER BY flow_status;
