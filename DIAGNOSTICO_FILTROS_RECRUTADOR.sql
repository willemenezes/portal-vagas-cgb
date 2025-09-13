-- =====================================================
-- DIAGNÓSTICO DOS PROBLEMAS DE FILTRO DO RECRUTADOR
-- =====================================================
-- Execute este script no Supabase SQL Editor

-- 1. VERIFICAR PERFIS DE RECRUTADORES E SUAS ATRIBUIÇÕES
SELECT 
    user_id,
    full_name,
    email,
    role,
    is_admin,
    assigned_states,
    assigned_cities,
    created_at
FROM public.rh_users 
WHERE role IN ('recrutador', 'rh', 'manager')
ORDER BY role, full_name;

-- 2. VERIFICAR VAGAS ATIVAS (QUE RECRUTADORES DEVERIAM VER)
SELECT 
    id,
    title,
    department,
    city,
    state,
    approval_status,
    status,
    created_at,
    created_by
FROM public.jobs 
WHERE approval_status IN ('active', 'ativo')
   OR status = 'active'
ORDER BY created_at DESC
LIMIT 15;

-- 3. VERIFICAR VAGAS DO PARÁ ESPECIFICAMENTE
SELECT 
    id,
    title,
    department,
    city,
    state,
    approval_status,
    status,
    created_at
FROM public.jobs 
WHERE state = 'PA'
ORDER BY created_at DESC;

-- 4. VERIFICAR CANDIDATOS DO PARÁ
SELECT 
    id,
    name,
    email,
    city,
    state,
    status,
    created_at
FROM public.candidates 
WHERE state = 'PA'
ORDER BY created_at DESC
LIMIT 10;

-- 5. VERIFICAR POSSÍVEIS PROBLEMAS DE ENUM
SELECT 
    DISTINCT approval_status,
    COUNT(*) as quantidade
FROM public.jobs 
GROUP BY approval_status
ORDER BY quantidade DESC;

-- 6. VERIFICAR POSSÍVEIS PROBLEMAS DE STATUS
SELECT 
    DISTINCT status,
    COUNT(*) as quantidade
FROM public.jobs 
GROUP BY status
ORDER BY quantidade DESC;

-- 7. VERIFICAR SE HÁ INCONSISTÊNCIAS NAS ATRIBUIÇÕES
SELECT 
    user_id,
    full_name,
    role,
    assigned_states,
    assigned_cities,
    CASE 
        WHEN assigned_states IS NULL AND assigned_cities IS NULL THEN 'SEM ATRIBUIÇÃO'
        WHEN assigned_states IS NOT NULL AND assigned_cities IS NOT NULL THEN 'ESTADOS E CIDADES'
        WHEN assigned_states IS NOT NULL THEN 'APENAS ESTADOS'
        WHEN assigned_cities IS NOT NULL THEN 'APENAS CIDADES'
    END as tipo_atribuicao
FROM public.rh_users 
WHERE role IN ('recrutador', 'rh')
ORDER BY tipo_atribuicao, full_name;

-- 8. VERIFICAR VAGAS RECENTES (ÚLTIMAS 48H)
SELECT 
    id,
    title,
    department,
    city,
    state,
    approval_status,
    status,
    created_at
FROM public.jobs 
WHERE created_at >= NOW() - INTERVAL '48 hours'
ORDER BY created_at DESC;
