-- Script para CORRIGIR e atualizar vagas expiradas
-- Execute este script para garantir que todas as vagas (incluindo expiradas) tenham datas corretas

-- 1. Verificar situação atual
SELECT 
    'ANTES DA ATUALIZAÇÃO' as etapa,
    COUNT(*) as total_vagas_ativas,
    COUNT(*) FILTER (WHERE expires_at < NOW()) as vagas_expiradas,
    COUNT(*) FILTER (WHERE expires_at != add_business_days(created_at, 20)) as vagas_com_data_incorreta
FROM public.jobs
WHERE flow_status = 'ativa'
    AND created_at IS NOT NULL;

-- 2. Atualizar TODAS as vagas ativas (incluindo expiradas)
-- Isso garante que todas tenham a data calculada corretamente (criação + 20 dias úteis)
UPDATE public.jobs
SET expires_at = add_business_days(created_at, 20)
WHERE 
    flow_status = 'ativa' 
    AND created_at IS NOT NULL;

-- 3. Verificar situação após atualização
SELECT 
    'APÓS ATUALIZAÇÃO' as etapa,
    COUNT(*) as total_vagas_ativas,
    COUNT(*) FILTER (WHERE expires_at < NOW()) as vagas_expiradas,
    COUNT(*) FILTER (WHERE expires_at != add_business_days(created_at, 20)) as vagas_com_data_incorreta
FROM public.jobs
WHERE flow_status = 'ativa'
    AND created_at IS NOT NULL;

-- 4. Mostrar exemplos de vagas expiradas
SELECT 
    title,
    city,
    created_at,
    expires_at,
    (expires_at - created_at) as diferenca_dias_corridos,
    CASE 
        WHEN expires_at < NOW() THEN 'EXPIRADA'
        ELSE 'ATIVA'
    END as status
FROM public.jobs
WHERE flow_status = 'ativa'
    AND created_at IS NOT NULL
    AND expires_at IS NOT NULL
    AND expires_at < NOW()
ORDER BY expires_at DESC
LIMIT 10;

