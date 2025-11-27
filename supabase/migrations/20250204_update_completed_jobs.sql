-- Migração para atualizar vagas existentes que já foram preenchidas (quantity = 0)
-- mas não estão marcadas como concluídas no flow_status

-- 1. Atualizar vagas com quantity = 0 ou quantity < 0 para flow_status = 'concluida'
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

-- 2. Log para verificar quantas vagas foram atualizadas
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Vagas atualizadas para concluída: %', updated_count;
END $$;

-- 3. Comentário para documentação
COMMENT ON COLUMN public.jobs.flow_status IS 'Status do fluxo da vaga: ativa (visível no site), concluida (preenchida - quantity = 0), congelada (pausada). Vagas com quantity = 0 devem ter flow_status = concluida.';

