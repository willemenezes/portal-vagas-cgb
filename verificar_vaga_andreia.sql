-- Script para verificar se a vaga "Analista Operacional - Altamir" ainda existe
-- Criada/modificada pelo usuário: silvia.andreia@cgbengenharia.com.br

-- 1. Buscar o ID do usuário Andreia
SELECT 
    user_id,
    email,
    full_name,
    role
FROM public.rh_users
WHERE email = 'silvia.andreia@cgbengenharia.com.br';

-- 2. Buscar vagas com título similar criadas ou aprovadas por ela (qualquer status)
SELECT 
    j.id,
    j.title,
    j.department,
    j.city,
    j.state,
    j.status,
    j.approval_status,
    j.flow_status,
    j.created_at,
    j.updated_at,
    j.created_by,
    ru_creator.full_name as created_by_name,
    ru_creator.email as created_by_email,
    j.quantity
FROM public.jobs j
LEFT JOIN public.rh_users ru_creator ON j.created_by = ru_creator.user_id
WHERE 
    j.title ILIKE '%Analista Operacional%' 
    OR j.title ILIKE '%Altamir%'
ORDER BY j.created_at DESC;

-- 3. Buscar em job_requests também (solicitações de vagas)
SELECT 
    jr.id,
    jr.title,
    jr.department,
    jr.location_city,
    jr.location_state,
    jr.status,
    jr.created_at,
    jr.created_by,
    jr.approved_by,
    jr.job_created
FROM public.job_requests jr
WHERE 
    jr.title ILIKE '%Analista Operacional%' 
    OR jr.title ILIKE '%Altamir%'
ORDER BY jr.created_at DESC;

-- 4. Verificar todas as vagas criadas por Andreia (últimas 20)
SELECT 
    j.id,
    j.title,
    j.city,
    j.state,
    j.status,
    j.approval_status,
    j.flow_status,
    j.created_at,
    ru.full_name as created_by_name,
    ru.email as created_by_email
FROM public.jobs j
LEFT JOIN public.rh_users ru ON j.created_by = ru.user_id
WHERE 
    ru.email = 'silvia.andreia@cgbengenharia.com.br'
    OR ru.full_name ILIKE '%andreia%'
ORDER BY j.created_at DESC
LIMIT 20;

