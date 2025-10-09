-- ============================================================================
-- QUERIES DE VALIDAÇÃO - Correção Limite 1000 Registros
-- Data: 09/10/2025
-- 
-- Execute estas queries no Supabase SQL Editor para validar as correções
-- ============================================================================

-- ============================================================================
-- 1. VALIDAÇÃO DO DASHBOARD
-- ============================================================================

-- 1.1 Total de Candidatos (deve bater com o dashboard)
SELECT 
    COUNT(*) as total_candidatos,
    'Dashboard deve mostrar exatamente este número' as validacao
FROM candidates;

-- 1.2 Total de Candidatos por Status (últimos 180 dias)
SELECT 
    status,
    COUNT(*) as total,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentual
FROM candidates
WHERE created_at >= NOW() - INTERVAL '180 days'
GROUP BY status
ORDER BY total DESC;

-- 1.3 Total de Vagas Ativas (deve bater com o dashboard)
SELECT 
    COUNT(*) as total_vagas_ativas,
    'Dashboard deve mostrar exatamente este número' as validacao
FROM jobs
WHERE status = 'active'
  AND approval_status = 'active'
  AND flow_status = 'ativa';

-- 1.4 Taxa de Conversão (% de aprovados)
SELECT 
    COUNT(*) FILTER (WHERE status = 'Aprovado') as aprovados,
    COUNT(*) as total_candidatos,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'Aprovado')::decimal / 
        NULLIF(COUNT(*), 0) * 100, 
        2
    ) as taxa_conversao_percentual
FROM candidates
WHERE created_at >= NOW() - INTERVAL '180 days';

-- 1.5 Top 5 Cidades com Mais Candidatos
SELECT 
    city,
    COUNT(*) as total_candidatos
FROM candidates
WHERE created_at >= NOW() - INTERVAL '180 days'
  AND city IS NOT NULL
GROUP BY city
ORDER BY total_candidatos DESC
LIMIT 5;

-- ============================================================================
-- 2. VALIDAÇÃO DO PROCESSO SELETIVO
-- ============================================================================

-- 2.1 Candidatos por Vaga (todas as vagas ativas)
SELECT 
    j.id,
    j.title,
    j.city,
    j.state,
    COUNT(c.id) as total_candidatos,
    COUNT(c.id) FILTER (WHERE c.status = 'Cadastrado') as cadastrado,
    COUNT(c.id) FILTER (WHERE c.status = 'Análise de Currículo') as analise_curriculo,
    COUNT(c.id) FILTER (WHERE c.status = 'Entrevista com RH') as entrevista_rh,
    COUNT(c.id) FILTER (WHERE c.status = 'Entrevista com Gestor') as entrevista_gestor,
    COUNT(c.id) FILTER (WHERE c.status = 'Validação TJ') as validacao_tj,
    COUNT(c.id) FILTER (WHERE c.status = 'Aprovado') as aprovado,
    COUNT(c.id) FILTER (WHERE c.status = 'Reprovado') as reprovado,
    COUNT(c.id) FILTER (WHERE c.status = 'Contratado') as contratado
FROM jobs j
LEFT JOIN candidates c ON c.job_id = j.id
WHERE j.flow_status = 'ativa'
GROUP BY j.id, j.title, j.city, j.state
ORDER BY total_candidatos DESC;

-- 2.2 Vaga Específica - Detalhamento Completo
-- (Substitua 'COLE_O_ID_DA_VAGA_AQUI' pelo ID real da vaga)
SELECT 
    status,
    COUNT(*) as total,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentual,
    STRING_AGG(name, ', ' ORDER BY created_at DESC) as candidatos_recentes
FROM candidates
WHERE job_id = 'COLE_O_ID_DA_VAGA_AQUI'
GROUP BY status
ORDER BY total DESC;

-- 2.3 Total por Vaga Específica (deve bater com a soma das colunas)
SELECT 
    j.title,
    COUNT(c.id) as total_candidatos,
    'A soma das colunas no Processo Seletivo deve ser exatamente este número' as validacao
FROM jobs j
LEFT JOIN candidates c ON c.job_id = j.id
WHERE j.id = 'COLE_O_ID_DA_VAGA_AQUI'
GROUP BY j.title;

-- 2.4 Vagas com Mais de 50 Candidatos (testar performance)
SELECT 
    j.id,
    j.title,
    j.city,
    COUNT(c.id) as total_candidatos
FROM jobs j
LEFT JOIN candidates c ON c.job_id = j.id
WHERE j.flow_status = 'ativa'
GROUP BY j.id, j.title, j.city
HAVING COUNT(c.id) > 50
ORDER BY total_candidatos DESC;

-- ============================================================================
-- 3. VALIDAÇÃO DE CONSISTÊNCIA DOS DADOS
-- ============================================================================

-- 3.1 Verificar se há candidatos sem vaga associada
SELECT 
    COUNT(*) as candidatos_sem_vaga,
    CASE 
        WHEN COUNT(*) > 0 THEN '⚠️ ATENÇÃO: Há candidatos sem vaga!'
        ELSE '✅ OK: Todos os candidatos têm vaga'
    END as status
FROM candidates
WHERE job_id IS NULL;

-- 3.2 Verificar se há vagas ativas sem candidatos
SELECT 
    j.id,
    j.title,
    j.city,
    j.state,
    'Vaga ativa sem candidatos' as alerta
FROM jobs j
LEFT JOIN candidates c ON c.job_id = j.id
WHERE j.flow_status = 'ativa'
  AND j.status = 'active'
  AND j.approval_status = 'active'
GROUP BY j.id, j.title, j.city, j.state
HAVING COUNT(c.id) = 0
ORDER BY j.created_at DESC;

-- 3.3 Distribuição de Candidatos por Status (visão geral)
SELECT 
    status,
    COUNT(*) as total,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentual,
    REPEAT('█', (COUNT(*) * 50 / SUM(COUNT(*)) OVER())::int) as grafico_visual
FROM candidates
GROUP BY status
ORDER BY total DESC;

-- ============================================================================
-- 4. VALIDAÇÃO DE PERFORMANCE
-- ============================================================================

-- 4.1 Candidatos Criados nos Últimos 7 Dias
SELECT 
    DATE(created_at) as data,
    COUNT(*) as novos_candidatos
FROM candidates
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- 4.2 Tempo Médio de Permanência em Cada Etapa
SELECT 
    status,
    COUNT(*) as total_candidatos,
    ROUND(AVG(EXTRACT(DAY FROM (NOW() - created_at))), 1) as dias_medio_na_etapa,
    MIN(EXTRACT(DAY FROM (NOW() - created_at))) as min_dias,
    MAX(EXTRACT(DAY FROM (NOW() - created_at))) as max_dias
FROM candidates
WHERE status NOT IN ('Contratado', 'Reprovado')
GROUP BY status
ORDER BY total_candidatos DESC;

-- ============================================================================
-- 5. VALIDAÇÃO ESPECÍFICA DO BUG CORRIGIDO
-- ============================================================================

-- 5.1 Verificar se há mais de 1000 candidatos (teste do limite)
SELECT 
    COUNT(*) as total_candidatos,
    CASE 
        WHEN COUNT(*) > 1000 THEN '✅ TESTE DO BUG: Sistema deve mostrar todos, não apenas 1000'
        WHEN COUNT(*) = 1000 THEN '⚠️ COINCIDÊNCIA: Exatamente 1000 candidatos'
        ELSE '✅ Total abaixo de 1000, mas correção ainda é válida'
    END as validacao_bug
FROM candidates;

-- 5.2 Comparar Total de Candidatos vs Soma das Etapas (por vaga)
WITH totais AS (
    SELECT 
        j.id as job_id,
        j.title,
        COUNT(c.id) as total_direto,
        SUM(CASE WHEN c.status IS NOT NULL THEN 1 ELSE 0 END) as total_soma_etapas
    FROM jobs j
    LEFT JOIN candidates c ON c.job_id = j.id
    WHERE j.flow_status = 'ativa'
    GROUP BY j.id, j.title
)
SELECT 
    job_id,
    title,
    total_direto,
    total_soma_etapas,
    total_direto - total_soma_etapas as diferenca,
    CASE 
        WHEN total_direto = total_soma_etapas THEN '✅ OK'
        ELSE '❌ INCONSISTÊNCIA!'
    END as validacao
FROM totais
WHERE total_direto > 0
ORDER BY ABS(total_direto - total_soma_etapas) DESC;

-- 5.3 Candidatos por Vaga - Comparação com Interface
SELECT 
    j.title as vaga,
    COUNT(c.id) as total_sql,
    '⚠️ Compare este número com o total mostrado na interface' as instrucao
FROM jobs j
LEFT JOIN candidates c ON c.job_id = j.id
WHERE j.flow_status = 'ativa'
GROUP BY j.id, j.title
ORDER BY total_sql DESC
LIMIT 10;

-- ============================================================================
-- 6. QUERIES DE DIAGNÓSTICO (SE HOUVER PROBLEMAS)
-- ============================================================================

-- 6.1 Identificar Candidatos Duplicados (mesmo email)
SELECT 
    email,
    COUNT(*) as total_registros,
    STRING_AGG(id::text, ', ') as ids_duplicados
FROM candidates
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY total_registros DESC;

-- 6.2 Candidatos com Dados Incompletos
SELECT 
    COUNT(*) FILTER (WHERE name IS NULL OR name = '') as sem_nome,
    COUNT(*) FILTER (WHERE email IS NULL OR email = '') as sem_email,
    COUNT(*) FILTER (WHERE phone IS NULL OR phone = '') as sem_telefone,
    COUNT(*) FILTER (WHERE city IS NULL OR city = '') as sem_cidade,
    COUNT(*) FILTER (WHERE status IS NULL OR status = '') as sem_status
FROM candidates;

-- 6.3 Vagas com Status Inconsistente
SELECT 
    id,
    title,
    status,
    approval_status,
    flow_status,
    'Status pode estar inconsistente' as alerta
FROM jobs
WHERE (
    (status = 'active' AND approval_status != 'active')
    OR (approval_status = 'active' AND flow_status NOT IN ('ativa', NULL))
    OR (status != 'active' AND flow_status = 'ativa')
)
ORDER BY created_at DESC;

-- ============================================================================
-- 7. VALIDAÇÃO FINAL - CHECKLIST RÁPIDO
-- ============================================================================

-- 7.1 Resumo Geral do Sistema
SELECT 
    (SELECT COUNT(*) FROM candidates) as total_candidatos,
    (SELECT COUNT(*) FROM jobs WHERE flow_status = 'ativa') as vagas_ativas,
    (SELECT COUNT(*) FROM candidates WHERE status = 'Aprovado') as candidatos_aprovados,
    (SELECT COUNT(*) FROM candidates WHERE status = 'Reprovado') as candidatos_reprovados,
    (SELECT COUNT(*) FROM candidates WHERE created_at >= NOW() - INTERVAL '7 days') as novos_ultimos_7_dias,
    (SELECT COUNT(*) FROM jobs WHERE created_at >= NOW() - INTERVAL '30 days') as vagas_ultimos_30_dias;

-- ============================================================================
-- FIM DAS QUERIES DE VALIDAÇÃO
-- ============================================================================

-- INSTRUÇÕES DE USO:
-- 1. Copie e cole cada query no SQL Editor do Supabase
-- 2. Execute e compare os resultados com a interface
-- 3. Anote qualquer discrepância no CHECKLIST_VALIDACAO_CORRECAO_1000.md
-- 4. Queries com "COLE_O_ID_DA_VAGA_AQUI" precisam ser editadas antes de executar

-- QUERIES MAIS IMPORTANTES PARA VALIDAÇÃO RÁPIDA:
-- - 1.1: Total de Candidatos
-- - 2.1: Candidatos por Vaga
-- - 5.1: Verificar Limite de 1000
-- - 5.2: Comparar Totais vs Soma

