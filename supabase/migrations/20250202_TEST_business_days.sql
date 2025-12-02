-- Script de TESTE para verificar se a função add_business_days está funcionando
-- Execute este script para diagnosticar o problema

-- 1. Testar a função add_business_days com uma data específica
-- Se uma vaga foi criada em 02/12/2025 (segunda-feira), deveria expirar em ~20 dias úteis
SELECT 
    '2025-12-02 13:05:18'::TIMESTAMP WITH TIME ZONE as data_criacao,
    add_business_days('2025-12-02 13:05:18'::TIMESTAMP WITH TIME ZONE, 20) as data_expiracao_calculada,
    (add_business_days('2025-12-02 13:05:18'::TIMESTAMP WITH TIME ZONE, 20) - '2025-12-02 13:05:18'::TIMESTAMP WITH TIME ZONE) as diferenca_total;

-- 2. Testar com outra data (29/11/2025)
SELECT 
    '2025-11-29 12:06:15'::TIMESTAMP WITH TIME ZONE as data_criacao,
    add_business_days('2025-11-29 12:06:15'::TIMESTAMP WITH TIME ZONE, 20) as data_expiracao_calculada,
    (add_business_days('2025-11-29 12:06:15'::TIMESTAMP WITH TIME ZONE, 20) - '2025-11-29 12:06:15'::TIMESTAMP WITH TIME ZONE) as diferenca_total;

-- 3. Verificar se a função is_holiday está funcionando
SELECT 
    '2025-12-25'::DATE as natal,
    is_holiday('2025-12-25'::DATE) as e_feriado_natal,
    '2025-12-24'::DATE as vespera_natal,
    is_holiday('2025-12-24'::DATE) as e_feriado_vespera,
    '2025-12-01'::DATE as dia_comum,
    is_holiday('2025-12-01'::DATE) as e_feriado_comum;

-- 4. Verificar as vagas atuais e comparar com o que deveria ser
SELECT 
    id,
    title,
    city,
    created_at,
    expires_at as expires_at_atual,
    add_business_days(created_at, 20) as expires_at_correto,
    (expires_at - created_at) as diferenca_atual_dias,
    (add_business_days(created_at, 20) - created_at) as diferenca_correta_dias,
    CASE 
        WHEN expires_at = add_business_days(created_at, 20) THEN 'CORRETO'
        ELSE 'INCORRETO - PRECISA ATUALIZAR'
    END as status
FROM public.jobs
WHERE flow_status = 'ativa'
    AND created_at IS NOT NULL
    AND expires_at IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

