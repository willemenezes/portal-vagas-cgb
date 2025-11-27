-- Script para atualizar vagas existentes que já foram preenchidas (quantity = 0)
-- mas não estão marcadas como concluídas no flow_status
-- 
-- Execute este script no Supabase SQL Editor ou via CLI:
-- supabase db execute --file scripts/update_completed_jobs.sql

-- 1. Verificar quantas vagas serão atualizadas (antes de executar)
SELECT 
    COUNT(*) as vagas_para_atualizar,
    COUNT(*) FILTER (WHERE flow_status IS NULL) as sem_flow_status,
    COUNT(*) FILTER (WHERE flow_status != 'concluida') as com_outro_status
FROM public.jobs
WHERE 
    (quantity = 0 OR quantity < 0)
    AND deleted_at IS NULL
    AND approval_status != 'rejected'
    AND status != 'draft'
    AND (flow_status IS NULL OR flow_status != 'concluida');

-- 2. Atualizar vagas com quantity = 0 ou quantity < 0 para flow_status = 'concluida'
-- Apenas atualizar vagas que:
--   - Não estão deletadas (deleted_at IS NULL)
--   - Não estão rejeitadas (approval_status != 'rejected')
--   - Não são rascunhos (status != 'draft')
--   - Ainda não estão marcadas como concluídas (flow_status != 'concluida')
UPDATE public.jobs
SET 
    flow_status = 'concluida',
    updated_at = NOW()
WHERE 
    (quantity = 0 OR quantity < 0)
    AND deleted_at IS NULL
    AND approval_status != 'rejected'
    AND status != 'draft'
    AND (flow_status IS NULL OR flow_status != 'concluida');

-- 3. Verificar resultado após atualização
SELECT 
    COUNT(*) as total_vagas_concluidas,
    COUNT(*) FILTER (WHERE quantity = 0) as com_quantity_zero,
    COUNT(*) FILTER (WHERE quantity < 0) as com_quantity_negativa
FROM public.jobs
WHERE 
    flow_status = 'concluida'
    AND deleted_at IS NULL;

