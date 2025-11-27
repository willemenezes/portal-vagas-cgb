-- Script para restaurar TODAS as vagas que foram rejeitadas recentemente
-- e que deveriam estar ativas (vagas editadas que foram rejeitadas incorretamente)
--
-- IMPORTANTE: Este script restaura vagas rejeitadas nos últimos 7 dias
-- Se uma vaga foi rejeitada há mais tempo e você quer restaurá-la, ajuste o intervalo

-- 1. Verificar quantas vagas serão restauradas ANTES de executar
SELECT 
    COUNT(*) as total_vagas_para_restaurar,
    COUNT(*) FILTER (WHERE approval_status = 'rejected') as rejeitadas,
    COUNT(*) FILTER (WHERE approval_status = 'pending_approval' AND status = 'draft') as pendentes_draft
FROM public.jobs
WHERE 
    deleted_at IS NULL
    AND updated_at >= NOW() - INTERVAL '7 days'
    AND (
        approval_status = 'rejected'
        OR (approval_status = 'pending_approval' AND status = 'draft')
    );

-- 2. Listar todas as vagas que serão restauradas (para revisão)
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
        WHEN approval_status = 'rejected' THEN '❌ REJEITADA - Será restaurada'
        WHEN approval_status = 'pending_approval' AND status = 'draft' THEN '⚠️ PENDENTE DRAFT - Será restaurada'
        ELSE '❓ Status desconhecido'
    END as situacao_atual
FROM public.jobs
WHERE 
    deleted_at IS NULL
    AND updated_at >= NOW() - INTERVAL '7 days'
    AND (
        approval_status = 'rejected'
        OR (approval_status = 'pending_approval' AND status = 'draft')
    )
ORDER BY updated_at DESC;

-- 3. RESTAURAR todas as vagas rejeitadas recentemente para ativa
-- ATENÇÃO: Execute apenas se tiver certeza de que essas vagas devem estar ativas
UPDATE public.jobs
SET 
    approval_status = 'active',
    status = 'active',
    flow_status = COALESCE(flow_status, 'ativa'), -- Manter flow_status atual ou definir como 'ativa'
    rejection_reason = NULL, -- Limpar motivo de rejeição
    updated_at = NOW()
WHERE 
    deleted_at IS NULL
    AND updated_at >= NOW() - INTERVAL '7 days'
    AND (
        approval_status = 'rejected'
        OR (approval_status = 'pending_approval' AND status = 'draft')
    );

-- 4. Verificar resultado após restauração
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
    AND updated_at >= NOW() - INTERVAL '7 days'
    AND (
        id IN (
            SELECT id FROM public.jobs
            WHERE deleted_at IS NULL
            AND updated_at >= NOW() - INTERVAL '7 days'
            AND (
                approval_status = 'rejected'
                OR (approval_status = 'pending_approval' AND status = 'draft')
            )
        )
    )
ORDER BY updated_at DESC;

-- 5. Contar quantas vagas foram restauradas
SELECT 
    COUNT(*) as vagas_restauradas_com_sucesso
FROM public.jobs
WHERE 
    deleted_at IS NULL
    AND updated_at >= NOW() - INTERVAL '7 days'
    AND approval_status = 'active'
    AND status = 'active'
    AND id IN (
        SELECT id FROM public.jobs
        WHERE deleted_at IS NULL
        AND updated_at >= NOW() - INTERVAL '7 days'
        AND (
            approval_status = 'rejected'
            OR (approval_status = 'pending_approval' AND status = 'draft')
        )
    );

-- NOTA: Se quiser restaurar vagas de um período diferente, ajuste o intervalo:
-- Exemplo para últimos 30 dias: INTERVAL '30 days'
-- Exemplo para uma data específica: updated_at >= '2025-02-01'

