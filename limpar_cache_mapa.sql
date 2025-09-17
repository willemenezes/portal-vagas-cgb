-- =====================================================
-- LIMPAR CACHE E DADOS ANTIGOS DO MAPA
-- =====================================================
-- Execute este script no Supabase SQL Editor

-- 1. VERIFICAR SE HÁ VAGAS ANTIGAS COM STATUS INCORRETO
SELECT 
    id,
    title,
    city,
    state,
    status,
    approval_status,
    created_at,
    'VERIFICAR: Esta vaga pode estar causando problema no mapa' as observacao
FROM public.jobs 
WHERE (status != 'active' OR approval_status != 'active')
  AND created_at < NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 2. LIMPAR VAGAS DE TESTE ANTIGAS (se existirem)
-- Descomente se quiser deletar vagas de teste antigas:
/*
DELETE FROM public.jobs 
WHERE (title ILIKE '%teste%' OR title ILIKE '%TESTE%')
  AND created_at < NOW() - INTERVAL '7 days';
*/

-- 3. VERIFICAR SE HÁ VAGAS COM DADOS INCONSISTENTES
SELECT 
    id,
    title,
    city,
    state,
    status,
    approval_status,
    created_at,
    CASE 
        WHEN city IS NULL OR city = '' THEN '❌ CIDADE VAZIA'
        WHEN state IS NULL OR state = '' THEN '❌ ESTADO VAZIO'
        WHEN city = 'Remoto' OR city = 'remoto' THEN '❌ REMOTO'
        WHEN title = 'Banco de Talentos' THEN '❌ BANCO DE TALENTOS'
        WHEN state != 'PA' THEN '❌ ESTADO INCORRETO'
        ELSE '✅ OK'
    END as status_verificacao
FROM public.jobs 
WHERE status = 'active' 
  AND approval_status = 'active'
ORDER BY created_at DESC;

-- 4. VERIFICAR VAGAS QUE DEVEM APARECER NO MAPA (CRITÉRIO EXATO)
SELECT 
    id,
    title,
    city,
    state,
    created_at,
    'ESTAS DEVEM APARECER NO MAPA' as observacao
FROM public.jobs 
WHERE status = 'active' 
  AND approval_status = 'active'
  AND city IS NOT NULL 
  AND city != ''
  AND city != 'Remoto'
  AND city != 'remoto'
  AND title != 'Banco de Talentos'
ORDER BY state, city;
