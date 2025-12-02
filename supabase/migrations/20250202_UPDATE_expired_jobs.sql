-- Script para atualizar vagas EXPIRADAS que não foram atualizadas anteriormente
-- IMPORTANTE: Este script atualiza vagas que já expiraram mas ainda têm flow_status='ativa'
-- Isso garante que mesmo vagas expiradas tenham a data de expiração calculada corretamente

-- 1. Verificar quantas vagas expiradas existem
SELECT 
    COUNT(*) as total_vagas_ativas,
    COUNT(*) FILTER (WHERE expires_at < NOW()) as vagas_expiradas,
    COUNT(*) FILTER (WHERE expires_at < NOW() AND expires_at != add_business_days(created_at, 20)) as vagas_expiradas_com_data_incorreta
FROM public.jobs
WHERE flow_status = 'ativa'
    AND created_at IS NOT NULL
    AND expires_at IS NOT NULL;

-- 2. Atualizar TODAS as vagas ativas, incluindo as que já expiraram
-- Isso recalcula a data de expiração baseado na data de criação + 20 dias úteis
UPDATE public.jobs
SET expires_at = add_business_days(created_at, 20)
WHERE 
    flow_status = 'ativa' 
    AND created_at IS NOT NULL;

-- 3. Verificar quantas vagas foram atualizadas
DO $$
DECLARE
    updated_count INT;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Vagas atualizadas (incluindo expiradas): %', updated_count;
END $$;

-- 4. Mostrar algumas vagas expiradas atualizadas
SELECT 
    id,
    title,
    city,
    created_at,
    expires_at as expires_at_atual,
    add_business_days(created_at, 20) as expires_at_esperado,
    (expires_at - created_at) as diferenca_dias,
    CASE 
        WHEN expires_at < NOW() THEN 'EXPIRADA'
        ELSE 'ATIVA'
    END as status_atual
FROM public.jobs
WHERE flow_status = 'ativa'
    AND created_at IS NOT NULL
    AND expires_at IS NOT NULL
    AND expires_at < NOW()
ORDER BY expires_at DESC
LIMIT 10;

