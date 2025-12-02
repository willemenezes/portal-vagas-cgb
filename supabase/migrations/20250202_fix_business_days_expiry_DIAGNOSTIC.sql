-- Script de DIAGNÓSTICO para verificar o problema de data de expiração
-- Execute este script ANTES do script de correção para entender o problema

-- 1. Verificar quantas vagas ativas existem
SELECT 
    COUNT(*) as total_vagas_ativas,
    COUNT(CASE WHEN expires_at IS NOT NULL THEN 1 END) as com_data_expiracao,
    COUNT(CASE WHEN expires_at IS NULL THEN 1 END) as sem_data_expiracao,
    COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as ainda_nao_expiradas,
    COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as ja_expiradas
FROM public.jobs
WHERE flow_status = 'ativa';

-- 2. Verificar algumas vagas ativas com suas datas
SELECT 
    id,
    title,
    city,
    created_at,
    expires_at,
    (expires_at - created_at) as diferenca_dias_corridos,
    flow_status,
    approval_status
FROM public.jobs
WHERE flow_status = 'ativa'
    AND expires_at IS NOT NULL
    AND created_at IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 3. Testar a função add_business_days com uma data de exemplo
-- Se hoje é 01/12/2025, deveria retornar uma data em ~20 dias úteis
SELECT 
    NOW() as hoje,
    add_business_days(NOW(), 20) as data_com_20_dias_uteis,
    (add_business_days(NOW(), 20) - NOW()) as diferenca_total;

-- 4. Testar com uma data específica de criação
-- Exemplo: vaga criada em 01/12/2025 às 18:08
SELECT 
    '2025-12-01 18:08:00'::TIMESTAMP WITH TIME ZONE as data_criacao,
    add_business_days('2025-12-01 18:08:00'::TIMESTAMP WITH TIME ZONE, 20) as data_expiracao_corrigida,
    (add_business_days('2025-12-01 18:08:00'::TIMESTAMP WITH TIME ZONE, 20) - '2025-12-01 18:08:00'::TIMESTAMP WITH TIME ZONE) as diferenca;

-- 5. Verificar se a função is_holiday está funcionando
SELECT 
    '2025-12-25'::DATE as natal,
    is_holiday('2025-12-25'::DATE) as e_feriado_natal,
    '2025-12-24'::DATE as vespera_natal,
    is_holiday('2025-12-24'::DATE) as e_feriado_vespera;

