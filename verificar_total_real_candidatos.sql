-- ========================================
-- VERIFICAÇÃO COMPLETA: Total REAL de Candidatos
-- ========================================

-- 1. CONTAGEM TOTAL DE CANDIDATOS (SEM FILTROS)
SELECT 
    COUNT(*) as total_candidatos,
    'TODOS OS CANDIDATOS' as descricao
FROM public.candidates;

-- 2. CANDIDATOS POR DATA DE CRIAÇÃO
SELECT 
    DATE_TRUNC('month', created_at) as mes,
    COUNT(*) as quantidade
FROM public.candidates
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mes DESC;

-- 3. CANDIDATOS DOS ÚLTIMOS 180 DIAS (6 MESES) - FILTRO ANTIGO
SELECT 
    COUNT(*) as candidatos_ultimos_6_meses,
    'ÚLTIMOS 6 MESES (filtro antigo problemático)' as descricao
FROM public.candidates
WHERE created_at >= NOW() - INTERVAL '180 days';

-- 4. CANDIDATOS DOS ÚLTIMOS 30 DIAS
SELECT 
    COUNT(*) as candidatos_ultimos_30_dias,
    'ÚLTIMOS 30 DIAS' as descricao
FROM public.candidates
WHERE created_at >= NOW() - INTERVAL '30 days';

-- 5. CANDIDATOS POR STATUS
SELECT 
    status,
    COUNT(*) as quantidade
FROM public.candidates
GROUP BY status
ORDER BY quantidade DESC;

-- 6. CANDIDATOS POR ESTADO
SELECT 
    state,
    COUNT(*) as quantidade
FROM public.candidates
WHERE state IS NOT NULL
GROUP BY state
ORDER BY quantidade DESC;

-- 7. CANDIDATOS MAIS ANTIGOS E MAIS RECENTES
SELECT 
    MIN(created_at) as candidato_mais_antigo,
    MAX(created_at) as candidato_mais_recente,
    MAX(created_at) - MIN(created_at) as periodo_total
FROM public.candidates;

-- 8. VERIFICAR SE HÁ CANDIDATOS NULL/DELETADOS
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN id IS NOT NULL THEN 1 END) as com_id,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as com_nome
FROM public.candidates;

-- 9. DISTRIBUIÇÃO POR ANO
SELECT 
    EXTRACT(YEAR FROM created_at) as ano,
    COUNT(*) as quantidade
FROM public.candidates
GROUP BY EXTRACT(YEAR FROM created_at)
ORDER BY ano DESC;

-- 10. TOTAL ABSOLUTO (QUERY SIMPLES)
SELECT COUNT(*) FROM public.candidates;

