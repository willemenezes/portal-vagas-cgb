-- =====================================================
-- VERIFICAR VAGAS QUE RECRUTADOR DEVE VER
-- =====================================================
-- Execute este script no Supabase SQL Editor

-- 1. VERIFICAR TODAS AS VAGAS APROVADAS (ATIVAS)
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
WHERE approval_status IN ('ativo', 'active')
ORDER BY created_at DESC
LIMIT 10;

-- 2. VERIFICAR VAGAS DO PARÁ ESPECIFICAMENTE
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
  AND approval_status IN ('ativo', 'active')
ORDER BY created_at DESC;

-- 3. VERIFICAR PERFIS DE USUÁRIOS RH
SELECT 
    user_id,
    full_name,
    email,
    role,
    is_admin,
    assigned_states,
    assigned_cities
FROM public.rh_users 
WHERE role = 'recrutador' 
   OR role = 'rh'
ORDER BY full_name;

-- 4. VERIFICAR VAGAS CRIADAS RECENTEMENTE (ÚLTIMAS 24H)
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
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 5. VERIFICAR SE HÁ VAGAS COM STATUS INCONSISTENTE
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
WHERE (approval_status = 'ativo' AND status != 'active')
   OR (approval_status = 'active' AND status != 'active')
ORDER BY created_at DESC;
