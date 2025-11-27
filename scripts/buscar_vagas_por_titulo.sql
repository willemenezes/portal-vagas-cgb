-- Script auxiliar para buscar vagas por título e encontrar os IDs corretos
-- Use este script se o script de restauração não encontrar as vagas

-- 1. Buscar "Atendente Presencial I" em Belém
SELECT 
    id,
    title,
    department,
    city,
    state,
    status,
    approval_status,
    flow_status,
    quantity,
    created_at,
    updated_at,
    deleted_at
FROM public.jobs
WHERE 
    deleted_at IS NULL
    AND title ILIKE '%Atendente Presencial%'
    AND city ILIKE '%Belém%'
ORDER BY updated_at DESC;

-- 2. Buscar "Assistente Administrativo - Cobrança" em Belém
SELECT 
    id,
    title,
    department,
    city,
    state,
    status,
    approval_status,
    flow_status,
    quantity,
    created_at,
    updated_at,
    deleted_at
FROM public.jobs
WHERE 
    deleted_at IS NULL
    AND title ILIKE '%Assistente%'
    AND title ILIKE '%Cobrança%'
    AND city ILIKE '%Belém%'
ORDER BY updated_at DESC;

-- 3. Buscar todas as vagas rejeitadas recentemente (últimas 48 horas)
-- Isso pode ajudar a identificar as vagas que sumiram
SELECT 
    id,
    title,
    department,
    city,
    state,
    status,
    approval_status,
    flow_status,
    quantity,
    rejection_reason,
    created_at,
    updated_at
FROM public.jobs
WHERE 
    deleted_at IS NULL
    AND approval_status = 'rejected'
    AND updated_at >= NOW() - INTERVAL '48 hours'
ORDER BY updated_at DESC;

-- 4. Buscar vagas editadas recentemente que podem ter sido rejeitadas
SELECT 
    id,
    title,
    department,
    city,
    state,
    status,
    approval_status,
    flow_status,
    quantity,
    rejection_reason,
    created_at,
    updated_at,
    CASE 
        WHEN approval_status = 'rejected' THEN '❌ REJEITADA'
        WHEN approval_status = 'pending_approval' THEN '⚠️ PENDENTE'
        WHEN approval_status = 'active' THEN '✅ ATIVA'
        ELSE '❓ ' || approval_status
    END as situacao
FROM public.jobs
WHERE 
    deleted_at IS NULL
    AND updated_at >= NOW() - INTERVAL '7 days'
    AND (
        approval_status = 'rejected'
        OR (approval_status = 'pending_approval' AND status = 'draft')
    )
ORDER BY updated_at DESC;

