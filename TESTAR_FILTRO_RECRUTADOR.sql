-- =====================================================
-- TESTAR FILTRO DE RECRUTADOR
-- =====================================================
-- Execute este script no Supabase SQL Editor

-- 1. CRIAR VAGA DE TESTE PARA RECRUTADOR DO PARÁ
INSERT INTO public.jobs (
    title,
    department,
    city,
    state,
    type,
    description,
    requirements,
    benefits,
    workload,
    approval_status,
    status,
    created_by
) VALUES (
    'TESTE RECRUTADOR PA - ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI:SS'),
    'Atendimento',
    'Belém',
    'PA',
    'CLT',
    'Vaga de teste para recrutador do Pará',
    ARRAY['Ensino médio completo'],
    ARRAY['Vale refeição', 'Plano de saúde'],
    '40h/semana',
    'ativo',
    'active',
    '00000000-0000-0000-0000-000000000000'
);

-- 2. VERIFICAR SE A VAGA FOI CRIADA
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
WHERE title LIKE 'TESTE RECRUTADOR PA%'
ORDER BY created_at DESC
LIMIT 5;

-- 3. VERIFICAR TODAS AS VAGAS ATIVAS DO PARÁ
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
  AND status = 'active'
ORDER BY created_at DESC;

-- 4. VERIFICAR USUÁRIOS RH COM ACESSO AO PARÁ
SELECT 
    user_id,
    full_name,
    email,
    role,
    is_admin,
    assigned_states,
    assigned_cities
FROM public.rh_users 
WHERE (assigned_states @> '["PA"]' OR assigned_cities @> '["Belém"]')
ORDER BY full_name;
