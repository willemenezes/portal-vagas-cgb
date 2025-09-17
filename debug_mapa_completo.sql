-- =====================================================
-- DEBUG COMPLETO DO MAPA - VERIFICAR TODOS OS DADOS
-- =====================================================
-- Execute este script no Supabase SQL Editor

-- 1. VERIFICAR TODAS AS VAGAS (ATIVAS E INATIVAS)
SELECT 
    id,
    title,
    city,
    state,
    status,
    approval_status,
    created_at,
    updated_at,
    CASE 
        WHEN status = 'active' AND approval_status = 'active' THEN '✅ ATIVA NO MAPA'
        WHEN status = 'active' AND approval_status != 'active' THEN '⚠️ STATUS ATIVO MAS NÃO APROVADA'
        WHEN status != 'active' AND approval_status = 'active' THEN '⚠️ APROVADA MAS STATUS INATIVO'
        ELSE '❌ INATIVA'
    END as status_mapa
FROM public.jobs 
ORDER BY created_at DESC;

-- 2. VERIFICAR VAGAS QUE DEVEM APARECER NO MAPA (useJobsRobust)
SELECT 
    id,
    title,
    city,
    state,
    created_at,
    'DEVERIA APARECER NO MAPA' as observacao
FROM public.jobs 
WHERE status = 'active' 
  AND approval_status = 'active'
ORDER BY created_at DESC;

-- 3. VERIFICAR VAGAS FILTRADAS PELO MAPA (JobsMap.tsx)
SELECT 
    id,
    title,
    city,
    state,
    created_at,
    'APARECE NO MAPA' as observacao
FROM public.jobs 
WHERE status = 'active' 
  AND approval_status = 'active'
  AND city IS NOT NULL 
  AND city != ''
  AND city != 'Remoto'
  AND city != 'remoto'
  AND title != 'Banco de Talentos'
ORDER BY state, city;

-- 4. VERIFICAR SE HÁ VAGAS COM DADOS ESTRANHOS
SELECT 
    id,
    title,
    city,
    state,
    created_at,
    CASE 
        WHEN city LIKE '%São Paulo%' OR city LIKE '%SP%' THEN '❌ CIDADE SP'
        WHEN city LIKE '%Brasília%' OR city LIKE '%DF%' THEN '❌ CIDADE DF'
        WHEN city LIKE '%Rio%' OR city LIKE '%RJ%' THEN '❌ CIDADE RJ'
        WHEN city LIKE '%Minas%' OR city LIKE '%MG%' THEN '❌ CIDADE MG'
        ELSE '✅ CIDADE OK'
    END as verificacao_cidade
FROM public.jobs 
WHERE status = 'active' 
  AND approval_status = 'active'
ORDER BY created_at DESC;

-- 5. VERIFICAR HISTÓRICO DE ALTERAÇÕES (últimas 24h)
SELECT 
    id,
    title,
    city,
    state,
    status,
    approval_status,
    created_at,
    updated_at,
    CASE 
        WHEN updated_at > created_at THEN 'MODIFICADA'
        ELSE 'ORIGINAL'
    END as tipo_alteracao
FROM public.jobs 
WHERE updated_at >= NOW() - INTERVAL '24 hours'
   OR created_at >= NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC, created_at DESC;
