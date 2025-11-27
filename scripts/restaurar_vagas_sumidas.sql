-- Script para restaurar vagas que sumiram após rejeição de edição
-- Vagas afetadas:
-- 1. "Atendente Presencial I - Belém"
-- 2. "Assistente Administrativo - Cobrança - Belém"
--
-- Execute este script no Supabase SQL Editor

-- 1. Verificar status atual das vagas antes de restaurar
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
    deleted_at,
    rejection_reason,
    CASE 
        WHEN approval_status = 'rejected' AND status = 'draft' THEN '❌ REJEITADA - Precisa restaurar'
        WHEN approval_status = 'active' AND status = 'active' THEN '✅ ATIVA - OK'
        WHEN approval_status = 'pending_approval' THEN '⚠️ PENDENTE - Aguardando aprovação'
        ELSE '⚠️ Status: ' || approval_status || ' / ' || status
    END as situacao
FROM public.jobs
WHERE 
    deleted_at IS NULL
    AND (
        (title ILIKE '%Atendente Presencial I%' AND city ILIKE '%Belém%')
        OR (title ILIKE '%Assistente Administrativo%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
    )
ORDER BY updated_at DESC;

-- 2. Restaurar vagas que estão rejeitadas/draft para ativa
-- Isso restaura o estado anterior (antes da edição ser rejeitada)
UPDATE public.jobs
SET 
    approval_status = 'active',
    status = 'active',
    flow_status = COALESCE(flow_status, 'ativa'), -- Manter flow_status atual ou definir como 'ativa'
    rejection_reason = NULL, -- Limpar motivo de rejeição
    updated_at = NOW()
WHERE 
    deleted_at IS NULL
    AND (
        (title ILIKE '%Atendente Presencial I%' AND city ILIKE '%Belém%')
        OR (title ILIKE '%Assistente Administrativo%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
    )
    AND (
        approval_status = 'rejected' 
        OR status = 'draft'
        OR (approval_status = 'pending_approval' AND status = 'draft')
    );

-- 3. Verificar resultado após restauração
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
    updated_at,
    CASE 
        WHEN approval_status = 'active' AND status = 'active' THEN '✅ RESTAURADA - Ativa no site'
        ELSE '⚠️ Ainda precisa verificação'
    END as resultado
FROM public.jobs
WHERE 
    deleted_at IS NULL
    AND (
        (title ILIKE '%Atendente Presencial I%' AND city ILIKE '%Belém%')
        OR (title ILIKE '%Assistente Administrativo%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
    )
ORDER BY updated_at DESC;

-- 4. Contar quantas vagas foram restauradas
SELECT 
    COUNT(*) as vagas_restauradas
FROM public.jobs
WHERE 
    deleted_at IS NULL
    AND (
        (title ILIKE '%Atendente Presencial I%' AND city ILIKE '%Belém%')
        OR (title ILIKE '%Assistente Administrativo%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
    )
    AND approval_status = 'active'
    AND status = 'active';

-- NOTA: Se as vagas não forem encontradas pelos títulos acima, você pode buscar por ID específico:
-- Substitua 'VAGA_ID_AQUI' pelo ID real da vaga
-- SELECT * FROM public.jobs WHERE id = 'VAGA_ID_AQUI';

