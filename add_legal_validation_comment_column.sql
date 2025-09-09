-- Adicionar coluna legal_validation_comment na tabela candidates
-- Executar em: https://supabase.com/dashboard/project/csgmamxhqkqdknohfsfj/sql

-- Adicionar coluna para comentários de validação jurídica
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS legal_validation_comment TEXT;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.candidates.legal_validation_comment IS 'Comentários e observações da validação jurídica (restrições, etc.)';

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'candidates' 
AND table_schema = 'public'
ORDER BY ordinal_position;
