-- Script de DIAGNÓSTICO para vagas expiradas
-- Execute este script para entender por que as vagas expiradas não aparecem

-- 1. Verificar quantas vagas ativas existem e quantas estão expiradas
SELECT 
    COUNT(*) as total_vagas_ativas,
    COUNT(*) FILTER (WHERE expires_at IS NOT NULL) as com_data_expiracao,
    COUNT(*) FILTER (WHERE expires_at < NOW()) as vagas_expiradas_por_data,
    COUNT(*) FILTER (WHERE expires_at >= NOW()) as vagas_ativas_por_data
FROM public.jobs
WHERE flow_status = 'ativa'
    AND created_at IS NOT NULL;

-- 2. Verificar algumas vagas que deveriam estar expiradas
SELECT 
    id,
    title,
    city,
    created_at,
    expires_at,
    NOW() as data_atual,
    (expires_at - NOW()) as diferenca_ate_agora,
    CASE 
        WHEN expires_at < NOW() THEN 'DEVERIA ESTAR EXPIRADA'
        ELSE 'AINDA ATIVA'
    END as status_esperado,
    flow_status,
    approval_status
FROM public.jobs
WHERE flow_status = 'ativa'
    AND created_at IS NOT NULL
    AND expires_at IS NOT NULL
ORDER BY expires_at ASC
LIMIT 20;

-- 3. Testar a função calculateBusinessDaysUntil manualmente
-- Simular o que o frontend faz: calcular dias úteis até a data de expiração
-- Se retornar negativo, a vaga está expirada
SELECT 
    id,
    title,
    expires_at,
    -- Simular o cálculo do frontend (dias úteis até expires_at)
    (
        SELECT COUNT(*)
        FROM generate_series(
            (NOW()::DATE + INTERVAL '1 day')::DATE,
            expires_at::DATE,
            '1 day'::INTERVAL
        )::DATE as dia
        WHERE EXTRACT(ISODOW FROM dia) NOT IN (6, 7)
        AND NOT is_holiday(dia)
    ) as dias_uteis_restantes_frontend,
    CASE 
        WHEN expires_at < NOW() THEN 'EXPIRADA (data passou)'
        WHEN expires_at::DATE = NOW()::DATE THEN 'EXPIRA HOJE'
        ELSE 'AINDA ATIVA'
    END as status_real
FROM public.jobs
WHERE flow_status = 'ativa'
    AND created_at IS NOT NULL
    AND expires_at IS NOT NULL
    AND expires_at < NOW()
ORDER BY expires_at DESC
LIMIT 10;

