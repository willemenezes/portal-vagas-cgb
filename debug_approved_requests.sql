-- Script para verificar solicitações aprovadas no banco de dados

-- 1. Ver todas as solicitações aprovadas
SELECT 
    id,
    title,
    department,
    city,
    state,
    status,
    job_created,
    approved_by,
    approved_at,
    created_at
FROM public.job_requests
WHERE status = 'aprovado'
ORDER BY created_at DESC;

-- 2. Ver perfil do admin (verificar role e is_admin)
SELECT 
    id,
    user_id,
    full_name,
    email,
    role,
    is_admin,
    assigned_states,
    assigned_cities,
    assigned_departments
FROM public.rh_users
WHERE email = 'seu_email_aqui@exemplo.com'  -- SUBSTITUA pelo seu email de admin
   OR role = 'admin'
   OR is_admin = true;

-- 3. Contar solicitações por status
SELECT 
    status,
    COUNT(*) as quantidade,
    COUNT(CASE WHEN job_created = true THEN 1 END) as ja_criadas,
    COUNT(CASE WHEN job_created = false OR job_created IS NULL THEN 1 END) as pendentes
FROM public.job_requests
GROUP BY status
ORDER BY status;

-- 4. Ver solicitações aprovadas nos últimos 7 dias
SELECT 
    id,
    title,
    city || ', ' || state as localizacao,
    status,
    job_created,
    approved_by,
    approved_at,
    AGE(NOW(), approved_at) as tempo_desde_aprovacao
FROM public.job_requests
WHERE status = 'aprovado'
  AND approved_at > NOW() - INTERVAL '7 days'
ORDER BY approved_at DESC;

