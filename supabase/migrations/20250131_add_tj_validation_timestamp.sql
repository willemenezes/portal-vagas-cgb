-- Adicionar campo para registrar quando candidato chegou em Validação TJ
-- Este campo permite ao jurídico saber há quanto tempo o candidato está aguardando (prazo de 48h)

-- 1. Adicionar coluna na tabela candidates
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS tj_validation_started_at TIMESTAMP WITH TIME ZONE;

-- 2. Criar índice para performance em queries
CREATE INDEX IF NOT EXISTS idx_candidates_tj_validation_started ON public.candidates(tj_validation_started_at);

-- 3. Comentário para documentação
COMMENT ON COLUMN public.candidates.tj_validation_started_at IS 'Data e hora em que o candidato chegou na etapa Validação TJ (prazo de 48h para análise)';

-- 4. Função para atualizar timestamp automaticamente quando status mudar para "Validação TJ"
CREATE OR REPLACE FUNCTION set_tj_validation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status mudou PARA "Validação TJ", registrar timestamp
  IF NEW.status = 'Validação TJ' AND (OLD.status IS NULL OR OLD.status != 'Validação TJ') THEN
    NEW.tj_validation_started_at := NOW();
  END IF;
  
  -- Se o status mudou DE "Validação TJ" para outra etapa, limpar timestamp
  IF OLD.status = 'Validação TJ' AND NEW.status != 'Validação TJ' THEN
    NEW.tj_validation_started_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para executar a função automaticamente
DROP TRIGGER IF EXISTS trigger_set_tj_validation_timestamp ON public.candidates;
CREATE TRIGGER trigger_set_tj_validation_timestamp
  BEFORE UPDATE OF status ON public.candidates
  FOR EACH ROW
  EXECUTE FUNCTION set_tj_validation_timestamp();

-- 6. Para candidatos que já estão em "Validação TJ", definir o timestamp como agora
UPDATE public.candidates 
SET tj_validation_started_at = NOW() 
WHERE status = 'Validação TJ' AND tj_validation_started_at IS NULL;
