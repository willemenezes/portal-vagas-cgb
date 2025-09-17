-- Adiciona campos de PCD, disponibilidade de viagem e idade no candidato
-- Seguro para rodar múltiplas vezes

ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS pcd VARCHAR(10);

ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS travel VARCHAR(10);

ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS age VARCHAR(10);


