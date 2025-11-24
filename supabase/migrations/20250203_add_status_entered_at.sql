-- Adicionar campo para registrar quando candidato entrou na etapa atual
-- Este campo permite calcular o tempo que o candidato passa em cada etapa do Kanban

-- 1. Adicionar coluna na tabela candidates
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS status_entered_at TIMESTAMP WITH TIME ZONE;

-- 2. Criar índice para performance em queries
CREATE INDEX IF NOT EXISTS idx_candidates_status_entered_at ON public.candidates(status_entered_at);

-- 3. Comentário para documentação
COMMENT ON COLUMN public.candidates.status_entered_at IS 'Data e hora em que o candidato entrou na etapa atual (status). Usado para calcular tempo em cada etapa do processo seletivo.';

-- 4. Função para atualizar timestamp automaticamente quando status mudar
CREATE OR REPLACE FUNCTION set_status_entered_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status mudou, atualizar timestamp para agora
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_entered_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para executar a função automaticamente
DROP TRIGGER IF EXISTS trigger_set_status_entered_at ON public.candidates;
CREATE TRIGGER trigger_set_status_entered_at
  BEFORE UPDATE OF status ON public.candidates
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION set_status_entered_at();

-- 6. Para candidatos existentes, definir status_entered_at como updated_at ou created_at
-- Isso garante que candidatos antigos tenham uma data inicial
UPDATE public.candidates 
SET status_entered_at = COALESCE(updated_at, created_at, NOW())
WHERE status_entered_at IS NULL;

-- 7. Para novos candidatos, definir status_entered_at automaticamente na criação
CREATE OR REPLACE FUNCTION set_initial_status_entered_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Se status_entered_at não foi definido, usar created_at
  IF NEW.status_entered_at IS NULL THEN
    NEW.status_entered_at := COALESCE(NEW.created_at, NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para novos candidatos
DROP TRIGGER IF EXISTS trigger_set_initial_status_entered_at ON public.candidates;
CREATE TRIGGER trigger_set_initial_status_entered_at
  BEFORE INSERT ON public.candidates
  FOR EACH ROW
  EXECUTE FUNCTION set_initial_status_entered_at();

