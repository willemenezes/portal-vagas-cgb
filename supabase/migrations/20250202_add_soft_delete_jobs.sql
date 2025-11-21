-- Implementar Soft Delete (Exclusão Lógica) na tabela jobs
-- Data: Fevereiro 2025
-- Permite marcar vagas como excluídas sem removê-las do banco
-- Possibilita recuperação e auditoria completa

-- 1. Adicionar coluna deleted_at (timestamp de exclusão)
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. Adicionar coluna deleted_by (ID do usuário que excluiu)
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Criar índice para performance em queries que filtram vagas não excluídas
CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at ON public.jobs(deleted_at) 
WHERE deleted_at IS NULL;

-- 4. Criar índice para queries de auditoria (vagas excluídas)
CREATE INDEX IF NOT EXISTS idx_jobs_deleted_by ON public.jobs(deleted_by) 
WHERE deleted_at IS NOT NULL;

-- 5. Comentários para documentação
COMMENT ON COLUMN public.jobs.deleted_at IS 'Data e hora da exclusão lógica. NULL = vaga ativa, NOT NULL = vaga excluída';
COMMENT ON COLUMN public.jobs.deleted_by IS 'ID do usuário que realizou a exclusão lógica da vaga';

-- 6. Criar view para facilitar consultas de vagas ativas (não excluídas)
CREATE OR REPLACE VIEW public.jobs_active AS
SELECT *
FROM public.jobs
WHERE deleted_at IS NULL;

-- 7. Criar view para facilitar consultas de vagas excluídas (auditoria)
CREATE OR REPLACE VIEW public.jobs_deleted AS
SELECT 
    j.*,
    ru.full_name as deleted_by_name,
    ru.email as deleted_by_email
FROM public.jobs j
LEFT JOIN public.rh_users ru ON j.deleted_by = ru.user_id
WHERE j.deleted_at IS NOT NULL
ORDER BY j.deleted_at DESC;

-- 8. Comentários para as views
COMMENT ON VIEW public.jobs_active IS 'View que retorna apenas vagas não excluídas (deleted_at IS NULL)';
COMMENT ON VIEW public.jobs_deleted IS 'View que retorna vagas excluídas com informações de quem excluiu e quando';

-- 9. Função para restaurar vaga excluída (soft delete reverso)
CREATE OR REPLACE FUNCTION public.restore_job(job_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.jobs
    SET 
        deleted_at = NULL,
        deleted_by = NULL,
        updated_at = NOW()
    WHERE id = job_id
        AND deleted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Garantir permissões para a função de restauração
GRANT EXECUTE ON FUNCTION public.restore_job(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_job(uuid) TO service_role;

-- 11. Comentário para a função
COMMENT ON FUNCTION public.restore_job(uuid) IS 'Restaura uma vaga que foi excluída via soft delete, removendo deleted_at e deleted_by';

-- 12. Função para limpar vagas excluídas há mais de 30 dias (exclusão permanente)
CREATE OR REPLACE FUNCTION public.permanently_delete_old_jobs()
RETURNS TABLE(deleted_count bigint, deleted_ids uuid[]) AS $$
DECLARE
    deleted_ids_array uuid[];
    deleted_count_result bigint;
BEGIN
    -- Coletar IDs das vagas que serão excluídas permanentemente
    SELECT ARRAY_AGG(id), COUNT(*)
    INTO deleted_ids_array, deleted_count_result
    FROM public.jobs
    WHERE deleted_at IS NOT NULL
        AND deleted_at < (NOW() - INTERVAL '30 days');
    
    -- Se não houver vagas para excluir, retornar
    IF deleted_ids_array IS NULL OR array_length(deleted_ids_array, 1) IS NULL THEN
        RETURN QUERY SELECT 0::bigint, ARRAY[]::uuid[];
        RETURN;
    END IF;
    
    -- Excluir candidatos associados (se necessário, dependendo da política de negócio)
    -- Por enquanto, mantemos os candidatos no histórico
    
    -- Excluir permanentemente as vagas
    DELETE FROM public.jobs
    WHERE id = ANY(deleted_ids_array);
    
    -- Retornar estatísticas
    RETURN QUERY SELECT deleted_count_result, deleted_ids_array;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Garantir permissões para a função de limpeza
GRANT EXECUTE ON FUNCTION public.permanently_delete_old_jobs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.permanently_delete_old_jobs() TO service_role;

-- 14. Comentário para a função de limpeza
COMMENT ON FUNCTION public.permanently_delete_old_jobs() IS 'Exclui permanentemente vagas que foram marcadas como excluídas (soft delete) há mais de 30 dias. Retorna o número de vagas excluídas e seus IDs.';

-- 15. Criar função para verificar quantas vagas serão excluídas na próxima limpeza
CREATE OR REPLACE FUNCTION public.count_jobs_to_permanently_delete()
RETURNS bigint AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.jobs
        WHERE deleted_at IS NOT NULL
            AND deleted_at < (NOW() - INTERVAL '30 days')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Garantir permissões para a função de contagem
GRANT EXECUTE ON FUNCTION public.count_jobs_to_permanently_delete() TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_jobs_to_permanently_delete() TO service_role;

-- 17. Comentário para a função de contagem
COMMENT ON FUNCTION public.count_jobs_to_permanently_delete() IS 'Retorna o número de vagas que serão excluídas permanentemente na próxima execução da limpeza (excluídas há mais de 30 dias).';

-- NOTA IMPORTANTE:
-- Após esta migração, todas as queries que buscam vagas devem filtrar por deleted_at IS NULL
-- ou usar a view jobs_active para garantir que apenas vagas não excluídas sejam retornadas.
--
-- LIMPEZA AUTOMÁTICA:
-- A função permanently_delete_old_jobs() pode ser executada:
-- 1. Manualmente via SQL Editor
-- 2. Via cron job no Supabase (Edge Functions)
-- 3. Via interface admin (implementar botão)
-- 
-- Recomendação: Executar semanalmente ou mensalmente para manter o banco limpo.

