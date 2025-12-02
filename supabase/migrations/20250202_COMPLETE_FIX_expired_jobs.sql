-- Script COMPLETO para verificar e corrigir todas as vagas
-- Execute este script para garantir que todas as vagas tenham datas corretas

-- 1. DIAGNÓSTICO: Verificar situação atual de TODAS as vagas
SELECT 
    flow_status,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE expires_at IS NOT NULL) as com_data_expiracao,
    COUNT(*) FILTER (WHERE expires_at IS NULL) as sem_data_expiracao,
    COUNT(*) FILTER (WHERE expires_at < NOW()) as expiradas,
    COUNT(*) FILTER (WHERE expires_at != add_business_days(created_at, 20)) as com_data_incorreta
FROM public.jobs
WHERE created_at IS NOT NULL
GROUP BY flow_status
ORDER BY flow_status;

-- 2. Mostrar exemplos de vagas que precisam ser atualizadas
SELECT 
    'VAGAS QUE PRECISAM SER ATUALIZADAS' as tipo,
    id,
    title,
    city,
    flow_status,
    created_at,
    expires_at as expires_at_atual,
    add_business_days(created_at, 20) as expires_at_correto,
    CASE 
        WHEN expires_at IS NULL THEN 'SEM DATA'
        WHEN expires_at != add_business_days(created_at, 20) THEN 'DATA INCORRETA'
        ELSE 'OK'
    END as problema
FROM public.jobs
WHERE created_at IS NOT NULL
    AND (
        expires_at IS NULL 
        OR expires_at != add_business_days(created_at, 20)
    )
ORDER BY created_at DESC
LIMIT 20;

-- 3. ATUALIZAR TODAS as vagas (ativa, concluída, congelada) que têm created_at
-- Isso garante que todas tenham a data calculada corretamente
UPDATE public.jobs
SET expires_at = add_business_days(created_at, 20)
WHERE 
    created_at IS NOT NULL
    AND (
        expires_at IS NULL 
        OR expires_at != add_business_days(created_at, 20)
    );

-- 4. Verificar quantas vagas foram atualizadas
DO $$
DECLARE
    updated_count INT;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Vagas atualizadas: %', updated_count;
END $$;

-- 5. VERIFICAÇÃO FINAL: Mostrar vagas expiradas após atualização
SELECT 
    'VAGAS EXPIRADAS APÓS ATUALIZAÇÃO' as tipo,
    title,
    city,
    flow_status,
    created_at,
    expires_at,
    (expires_at - created_at) as diferenca_dias,
    CASE 
        WHEN expires_at < NOW() THEN 'EXPIRADA'
        ELSE 'ATIVA'
    END as status
FROM public.jobs
WHERE created_at IS NOT NULL
    AND expires_at IS NOT NULL
    AND expires_at < NOW()
    AND flow_status = 'ativa'
ORDER BY expires_at DESC
LIMIT 20;

