-- Script para restaurar uma vaga específica por ID
-- Use este script quando souber o ID exato da vaga que precisa ser restaurada
--
-- INSTRUÇÕES:
-- 1. Substitua 'VAGA_ID_AQUI' pelo ID real da vaga
-- 2. Execute as queries em sequência

-- EXEMPLO: ID da vaga "Encarregado Operacional" em Redenção, PA
-- ID: cf269bc0-353d-4fe4-b253-8203fc0771ec

-- 1. Verificar status atual da vaga antes de restaurar
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
        WHEN approval_status = 'rejected' AND status = 'draft' THEN '❌ REJEITADA - Precisa restaurar'
        WHEN approval_status = 'active' AND status = 'active' THEN '✅ ATIVA - Já está OK'
        WHEN approval_status = 'pending_approval' THEN '⚠️ PENDENTE - Aguardando aprovação'
        ELSE '⚠️ Status: ' || approval_status || ' / ' || status
    END as situacao
FROM public.jobs
WHERE id = 'cf269bc0-353d-4fe4-b253-8203fc0771ec'; -- SUBSTITUA PELO ID DA VAGA

-- 2. Restaurar a vaga específica
UPDATE public.jobs
SET 
    approval_status = 'active',
    status = 'active',
    flow_status = COALESCE(flow_status, 'ativa'), -- Manter flow_status atual ou definir como 'ativa'
    rejection_reason = NULL, -- Limpar motivo de rejeição
    updated_at = NOW()
WHERE 
    id = 'cf269bc0-353d-4fe4-b253-8203fc0771ec' -- SUBSTITUA PELO ID DA VAGA
    AND deleted_at IS NULL
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
WHERE id = 'cf269bc0-353d-4fe4-b253-8203fc0771ec'; -- SUBSTITUA PELO ID DA VAGA

-- ============================================
-- EXEMPLO PARA RESTAURAR MÚLTIPLAS VAGAS:
-- ============================================
-- UPDATE public.jobs
-- SET 
--     approval_status = 'active',
--     status = 'active',
--     flow_status = COALESCE(flow_status, 'ativa'),
--     rejection_reason = NULL,
--     updated_at = NOW()
-- WHERE 
--     id IN (
--         'cf269bc0-353d-4fe4-b253-8203fc0771ec', -- Encarregado Operacional
--         'OUTRO_ID_AQUI', -- Outra vaga
--         'MAIS_UM_ID_AQUI' -- Mais uma vaga
--     )
--     AND deleted_at IS NULL;

