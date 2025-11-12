-- Adicionar 'approved_with_restrictions' ao CHECK constraint de review_status
-- Primeiro, remover a constraint antiga
ALTER TABLE public.candidate_legal_data 
DROP CONSTRAINT IF EXISTS candidate_legal_data_review_status_check;

-- Adicionar a nova constraint com o valor adicional
ALTER TABLE public.candidate_legal_data 
ADD CONSTRAINT candidate_legal_data_review_status_check 
CHECK (review_status IN ('pending', 'approved', 'rejected', 'request_changes', 'approved_with_restrictions'));

-- Migrar registros existentes: se approved com review_notes ou legal_validation_comment, atualizar para approved_with_restrictions
UPDATE public.candidate_legal_data
SET review_status = 'approved_with_restrictions'
WHERE review_status = 'approved'
  AND (
    (review_notes IS NOT NULL AND LENGTH(TRIM(review_notes)) > 0)
    OR EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE public.candidates.id = public.candidate_legal_data.candidate_id 
      AND public.candidates.legal_validation_comment IS NOT NULL 
      AND LENGTH(TRIM(public.candidates.legal_validation_comment)) > 0
    )
  );

