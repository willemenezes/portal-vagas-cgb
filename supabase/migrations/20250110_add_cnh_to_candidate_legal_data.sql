-- Adicionar campo CNH à tabela candidate_legal_data
ALTER TABLE candidate_legal_data 
ADD COLUMN IF NOT EXISTS cnh TEXT;

-- Comentário: Campo para armazenar informações sobre CNH do candidato
COMMENT ON COLUMN candidate_legal_data.cnh IS 'Informações sobre CNH do candidato (ex: CNH - B - PERMANENTE, NÃO POSSUI, etc.)';
