-- =====================================================
-- VERIFICAR E CORRIGIR VAGAS NO MAPA
-- =====================================================
-- Execute este script no Supabase SQL Editor

-- 1. VERIFICAR TODAS AS VAGAS ATIVAS E SUAS LOCALIZAÇÕES
SELECT 
    id,
    title,
    department,
    city,
    state,
    approval_status,
    status,
    created_at,
    CASE 
        WHEN city IS NULL OR city = '' THEN '❌ CIDADE VAZIA'
        WHEN state IS NULL OR state = '' THEN '❌ ESTADO VAZIO'
        WHEN city = 'Remoto' OR city = 'remoto' THEN '❌ REMOTO'
        WHEN title = 'Banco de Talentos' THEN '❌ BANCO DE TALENTOS'
        ELSE '✅ VÁLIDA PARA MAPA'
    END as status_mapa
FROM public.jobs 
WHERE approval_status = 'active' 
  AND status = 'active'
ORDER BY created_at DESC;

-- 2. VERIFICAR VAGAS QUE APARECEM NO MAPA (devem ser apenas do Pará)
SELECT 
    id,
    title,
    city,
    state,
    created_at
FROM public.jobs 
WHERE approval_status = 'active' 
  AND status = 'active'
  AND city IS NOT NULL 
  AND city != ''
  AND city != 'Remoto'
  AND city != 'remoto'
  AND title != 'Banco de Talentos'
ORDER BY state, city;

-- 3. VERIFICAR SE HÁ VAGAS COM ESTADO INCORRETO (não deveria ter vagas fora do Pará)
SELECT 
    state,
    COUNT(*) as quantidade_vagas,
    STRING_AGG(title, ', ') as titulos_vagas
FROM public.jobs 
WHERE approval_status = 'active' 
  AND status = 'active'
  AND city IS NOT NULL 
  AND city != ''
  AND city != 'Remoto'
  AND city != 'remoto'
  AND title != 'Banco de Talentos'
GROUP BY state
ORDER BY quantidade_vagas DESC;

-- 4. VERIFICAR VAGAS RECENTES (últimas 7 dias)
SELECT 
    id,
    title,
    city,
    state,
    approval_status,
    status,
    created_at
FROM public.jobs 
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
