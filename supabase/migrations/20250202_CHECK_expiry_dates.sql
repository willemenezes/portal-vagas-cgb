-- Script para verificar as datas de expiração e comparar com o esperado
-- Execute este script para ver quais vagas têm problemas

-- 1. Verificar vagas que expiram em datas estranhas (muito no futuro ou no passado)
SELECT 
    id,
    title,
    city,
    created_at,
    expires_at,
    (expires_at - created_at) as diferenca_dias_corridos,
    add_business_days(created_at, 20) as expires_at_esperado,
    CASE 
        WHEN expires_at = add_business_days(created_at, 20) THEN 'CORRETO'
        ELSE 'INCORRETO'
    END as status,
    flow_status
FROM public.jobs
WHERE flow_status = 'ativa'
    AND created_at IS NOT NULL
    AND expires_at IS NOT NULL
ORDER BY expires_at DESC
LIMIT 20;

-- 2. Verificar se há vagas com data de expiração muito diferente do esperado
SELECT 
    COUNT(*) as total_vagas_ativas,
    COUNT(*) FILTER (WHERE expires_at = add_business_days(created_at, 20)) as vagas_corretas,
    COUNT(*) FILTER (WHERE expires_at != add_business_days(created_at, 20)) as vagas_incorretas,
    COUNT(*) FILTER (WHERE expires_at < NOW()) as vagas_expiradas,
    COUNT(*) FILTER (WHERE expires_at > NOW() + INTERVAL '1 year') as vagas_muito_futuro
FROM public.jobs
WHERE flow_status = 'ativa'
    AND created_at IS NOT NULL
    AND expires_at IS NOT NULL;

-- 3. Verificar vagas que expiram em 18/07/2025 (parece estranho)
SELECT 
    id,
    title,
    city,
    created_at,
    expires_at,
    (expires_at - created_at) as diferenca_dias,
    add_business_days(created_at, 20) as expires_at_esperado
FROM public.jobs
WHERE expires_at::DATE = '2025-07-18'
    AND flow_status = 'ativa';

