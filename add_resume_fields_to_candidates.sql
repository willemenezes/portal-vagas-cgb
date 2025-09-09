-- Adicionar campos de currículo na tabela candidates
-- Executar em: https://supabase.com/dashboard/project/csgmamxhqkqdknohfsfj/sql

-- Adicionar campos para URL e nome do arquivo de currículo
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS resume_file_url TEXT,
ADD COLUMN IF NOT EXISTS resume_file_name TEXT;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.candidates.resume_file_url IS 'URL do arquivo de currículo no Supabase Storage';
COMMENT ON COLUMN public.candidates.resume_file_name IS 'Nome original do arquivo de currículo';

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'candidates' 
AND table_schema = 'public'
AND column_name IN ('resume_file_url', 'resume_file_name')
ORDER BY ordinal_position;
