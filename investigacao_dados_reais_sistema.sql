-- ========================================
-- INVESTIGAÇÃO DETALHADA: Dados Reais do Sistema
-- ========================================

-- 1. TOTAL ABSOLUTO DE CANDIDATOS
SELECT 
    COUNT(*) as total_candidatos,
    'TOTAL GERAL' as descricao
FROM public.candidates;

-- 2. CANDIDATOS POR MÊS (últimos 12 meses)
SELECT 
    TO_CHAR(created_at, 'YYYY-MM') as mes_ano,
    COUNT(*) as quantidade,
    MIN(created_at) as primeiro_candidato_mes,
    MAX(created_at) as ultimo_candidato_mes
FROM public.candidates
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY mes_ano DESC;

-- 3. CANDIDATOS POR DIA (últimos 30 dias)
SELECT 
    DATE(created_at) as data,
    COUNT(*) as quantidade
FROM public.candidates
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- 4. PERÍODO REAL DOS DADOS
SELECT 
    MIN(created_at) as primeiro_candidato_sistema,
    MAX(created_at) as ultimo_candidato_sistema,
    COUNT(*) as total_candidatos,
    MAX(created_at) - MIN(created_at) as periodo_total_dias
FROM public.candidates;

-- 5. CANDIDATOS ÚLTIMOS 2 MESES (60 DIAS)
SELECT 
    COUNT(*) as candidatos_ultimos_2_meses,
    'ÚLTIMOS 2 MESES' as descricao
FROM public.candidates
WHERE created_at >= NOW() - INTERVAL '60 days';

-- 6. CANDIDATOS ÚLTIMOS 3 MESES (90 DIAS)
SELECT 
    COUNT(*) as candidatos_ultimos_3_meses,
    'ÚLTIMOS 3 MESES' as descricao
FROM public.candidates
WHERE created_at >= NOW() - INTERVAL '90 days';

-- 7. VERIFICAR SE HÁ CANDIDATOS DUPLICADOS
SELECT 
    email,
    COUNT(*) as quantidade
FROM public.candidates
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY quantidade DESC
LIMIT 10;

-- 8. CANDIDATOS POR STATUS (para verificar distribuição)
SELECT 
    status,
    COUNT(*) as quantidade,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public.candidates), 2) as percentual
FROM public.candidates
GROUP BY status
ORDER BY quantidade DESC;

-- 9. CANDIDATOS POR VAGA (top 10 vagas com mais candidatos)
SELECT 
    j.title as vaga,
    j.department as departamento,
    j.city as cidade,
    j.state as estado,
    COUNT(c.id) as total_candidatos
FROM public.candidates c
LEFT JOIN public.jobs j ON c.job_id = j.id
GROUP BY j.id, j.title, j.department, j.city, j.state
ORDER BY total_candidatos DESC
LIMIT 10;

-- 10. VERIFICAR SE HÁ PROBLEMAS DE TIMEZONE OU DATA
SELECT 
    created_at,
    applied_date,
    updated_at,
    name,
    email
FROM public.candidates
ORDER BY created_at DESC
LIMIT 5;

