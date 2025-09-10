-- Adicionar colunas CNH e tipo de veículo à tabela candidates
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna CNH
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS cnh VARCHAR(10);

-- Adicionar coluna tipo de veículo
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS vehicle VARCHAR(20);

-- Comentários para documentar as colunas
COMMENT ON COLUMN public.candidates.cnh IS 'CNH do candidato: sim, não';
COMMENT ON COLUMN public.candidates.vehicle IS 'Tipo de veículo: carro, moto, nao';

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'candidates' 
AND column_name IN ('cnh', 'vehicle');
