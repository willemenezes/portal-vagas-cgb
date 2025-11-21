-- Script para verificar vagas pendentes de aprovação
-- Use este script para verificar se as vagas estão sendo salvas corretamente

-- 1. Verificar TODAS as vagas com approval_status = 'pending_approval'
SELECT 
    id,
    title,
    department,
    city,
    state,
    status,
    approval_status,
    flow_status,
    created_at,
    updated_at,
    created_by,
    deleted_at
FROM public.jobs
WHERE approval_status = 'pending_approval'
    AND deleted_at IS NULL
ORDER BY updated_at DESC;

-- 2. Contar quantas vagas estão pendentes
SELECT 
    COUNT(*) as total_pendentes
FROM public.jobs
WHERE approval_status = 'pending_approval'
    AND deleted_at IS NULL;

-- 3. Verificar vagas editadas recentemente (últimas 24 horas) que deveriam estar pendentes
SELECT 
    id,
    title,
    department,
    city,
    state,
    status,
    approval_status,
    flow_status,
    updated_at,
    CASE 
        WHEN approval_status = 'pending_approval' THEN '✅ CORRETO'
        WHEN approval_status = 'active' THEN '❌ ERRADO - Deveria ser pending_approval'
        ELSE '⚠️ Status: ' || approval_status
    END as status_verificacao
FROM public.jobs
WHERE updated_at >= NOW() - INTERVAL '24 hours'
    AND deleted_at IS NULL
ORDER BY updated_at DESC;

-- 4. Verificar se há vagas ativas que foram editadas mas não voltaram para pending_approval
SELECT 
    id,
    title,
    department,
    city,
    state,
    status,
    approval_status,
    flow_status,
    updated_at,
    '⚠️ Vaga ativa editada mas não voltou para pending_approval' as problema
FROM public.jobs
WHERE (approval_status = 'active' OR status = 'active')
    AND flow_status = 'ativa'
    AND updated_at >= NOW() - INTERVAL '24 hours'
    AND deleted_at IS NULL
ORDER BY updated_at DESC;

