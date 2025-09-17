-- Apagar exatamente DOIS registros de "Banco de Talentos" em rascunho
-- Mantém todos os demais (inclui o ativo e o mais recente se houver)

BEGIN;

-- 1) Conferir o que existe antes
-- SELECT id, title, status, approval_status, created_at FROM jobs WHERE title = 'Banco de Talentos' ORDER BY created_at DESC;

WITH drafts AS (
  SELECT id
  FROM jobs
  WHERE title = 'Banco de Talentos'
    AND (
      status = 'draft'
      OR approval_status IN ('draft', 'rascunho')
    )
  ORDER BY created_at ASC
), to_delete AS (
  SELECT id FROM drafts LIMIT 2
)
-- Opcional: remover candidatos associados (provável que não existam em rascunho)
DELETE FROM candidates
WHERE job_id IN (SELECT id FROM to_delete);

DELETE FROM jobs
WHERE id IN (SELECT id FROM to_delete);

-- 2) Verificar resultado após a exclusão
-- SELECT id, title, status, approval_status, created_at FROM jobs WHERE title = 'Banco de Talentos' ORDER BY created_at DESC;

COMMIT;


