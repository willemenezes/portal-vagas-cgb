-- Script FORÇADO para atualizar TODAS as vagas ativas
-- Use este script se o script principal não atualizou as vagas
-- ATENÇÃO: Este script atualiza TODAS as vagas ativas, mesmo as que já expiraram

-- 1. Primeiro, vamos ver quantas vagas serão atualizadas
DO $$
DECLARE
    total_count INT;
BEGIN
    SELECT COUNT(*) INTO total_count
    FROM public.jobs
    WHERE flow_status = 'ativa' 
        AND created_at IS NOT NULL;
    
    RAISE NOTICE 'Total de vagas ativas que serão atualizadas: %', total_count;
END $$;

-- 2. Atualizar TODAS as vagas ativas (forçar recálculo)
-- Remove a condição expires_at > NOW() para atualizar todas, mesmo as expiradas
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
    RAISE NOTICE 'Vagas atualizadas: %', updated_count;
END $$;

-- 4. Mostrar algumas vagas atualizadas para verificação
SELECT 
    id,
    title,
    city,
    created_at,
    expires_at,
    (expires_at - created_at) as diferenca_dias,
    flow_status
FROM public.jobs
WHERE flow_status = 'ativa'
    AND created_at IS NOT NULL
    AND expires_at IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

