-- Script para verificar vagas excluídas hoje
-- IMPORTANTE: Se o sistema não tiver soft delete ou auditoria, 
-- as vagas excluídas não estarão mais no banco de dados

-- 1. Verificar se existe alguma tabela de auditoria ou log
SELECT 
    table_name,
    table_schema
FROM information_schema.tables
WHERE 
    table_schema = 'public'
    AND (
        table_name ILIKE '%audit%' 
        OR table_name ILIKE '%log%' 
        OR table_name ILIKE '%history%'
        OR table_name ILIKE '%deleted%'
        OR table_name ILIKE '%exclu%'
    )
ORDER BY table_name;

-- 2. Verificar se a tabela jobs tem coluna deleted_at ou is_deleted (soft delete)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'jobs'
    AND (
        column_name ILIKE '%deleted%'
        OR column_name ILIKE '%exclu%'
        OR column_name ILIKE '%is_active%'
    );

-- 3. Verificar se há triggers na tabela jobs que podem registrar exclusões
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE 
    event_object_schema = 'public'
    AND event_object_table = 'jobs'
    AND event_manipulation = 'DELETE';

-- 4. Verificar vagas que foram atualizadas hoje (pode indicar mudança de status antes da exclusão)
SELECT 
    j.id,
    j.title,
    j.department,
    j.city,
    j.state,
    j.status,
    j.approval_status,
    j.flow_status,
    j.updated_at,
    ru.full_name as updated_by_name,
    ru.email as updated_by_email
FROM public.jobs j
LEFT JOIN public.rh_users ru ON j.created_by = ru.user_id
WHERE 
    DATE(j.updated_at) = CURRENT_DATE
    OR DATE(j.created_at) = CURRENT_DATE
ORDER BY j.updated_at DESC;

-- 5. Verificar solicitações de vagas (job_requests) que podem ter sido excluídas
-- Nota: job_requests também não tem soft delete, mas podemos verificar as que existem hoje
SELECT 
    jr.id,
    jr.title,
    jr.department,
    jr.city,
    jr.state,
    jr.status,
    jr.created_at,
    jr.updated_at,
    jr.job_created
FROM public.job_requests jr
WHERE 
    DATE(jr.updated_at) = CURRENT_DATE
    OR DATE(jr.created_at) = CURRENT_DATE
ORDER BY jr.updated_at DESC;

-- 6. Verificar candidatos que podem ter sido associados a vagas que não existem mais
-- (Isso pode indicar vagas que foram excluídas)
SELECT DISTINCT
    c.job_id,
    COUNT(c.id) as total_candidatos,
    MAX(c.created_at) as ultima_candidatura
FROM public.candidates c
LEFT JOIN public.jobs j ON c.job_id = j.id
WHERE 
    c.job_id IS NOT NULL
    AND j.id IS NULL  -- Vaga não existe mais
GROUP BY c.job_id
ORDER BY ultima_candidatura DESC
LIMIT 20;

-- 7. Verificar se há alguma view ou função que mantém histórico
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE 
    routine_schema = 'public'
    AND (
        routine_name ILIKE '%audit%'
        OR routine_name ILIKE '%log%'
        OR routine_name ILIKE '%history%'
        OR routine_name ILIKE '%deleted%'
    );

-- NOTA FINAL:
-- Se nenhuma das queries acima retornar dados sobre exclusões,
-- significa que o sistema não tem rastreamento de exclusões.
-- As vagas excluídas foram removidas permanentemente do banco de dados
-- e não podem ser recuperadas sem um backup do banco de dados.

