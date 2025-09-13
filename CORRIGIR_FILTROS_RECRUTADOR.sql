-- =====================================================
-- CORRIGIR PROBLEMAS DE FILTRO DO RECRUTADOR
-- =====================================================
-- Execute este script no Supabase SQL Editor

-- PROBLEMA 1: Corrigir vagas com approval_status incorreto
-- Atualizar vagas que estão com 'ativo' para 'active'
UPDATE public.jobs 
SET approval_status = 'active'
WHERE approval_status = 'ativo';

-- PROBLEMA 2: Verificar se há recrutadores sem atribuições específicas
-- Isso pode estar causando eles verem todas as vagas/candidatos

-- Listar recrutadores sem atribuições
SELECT 
    user_id,
    full_name,
    email,
    role,
    assigned_states,
    assigned_cities
FROM public.rh_users 
WHERE role IN ('recrutador', 'rh')
  AND (assigned_states IS NULL OR assigned_states = '[]')
  AND (assigned_cities IS NULL OR assigned_cities = '[]');

-- VERIFICAR RESULTADO DAS CORREÇÕES
-- 1. Verificar se todas as vagas agora têm approval_status correto
SELECT 
    approval_status,
    COUNT(*) as quantidade
FROM public.jobs 
GROUP BY approval_status
ORDER BY quantidade DESC;

-- 2. Verificar vagas ativas que recrutadores do Pará deveriam ver
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
  AND approval_status = 'active'
  AND status = 'active'
ORDER BY created_at DESC;

-- 3. Verificar atribuições de todos os usuários RH
SELECT 
    user_id,
    full_name,
    email,
    role,
    is_admin,
    assigned_states,
    assigned_cities,
    CASE 
        WHEN is_admin = true THEN 'ADMIN - VÊ TUDO'
        WHEN assigned_states IS NULL AND assigned_cities IS NULL THEN 'SEM ATRIBUIÇÃO - PROBLEMA!'
        WHEN assigned_states IS NOT NULL AND assigned_cities IS NOT NULL THEN 'ESTADOS E CIDADES ESPECÍFICAS'
        WHEN assigned_states IS NOT NULL THEN 'APENAS ESTADOS'
        WHEN assigned_cities IS NOT NULL THEN 'APENAS CIDADES'
    END as situacao
FROM public.rh_users 
WHERE role IN ('recrutador', 'rh', 'manager')
ORDER BY situacao, full_name;
