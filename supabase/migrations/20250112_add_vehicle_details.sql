-- Adiciona campos opcionais de detalhes do veículo para exibição no processo seletivo
-- Seguro para rodar múltiplas vezes

ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS vehicle_model VARCHAR(100);

ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS vehicle_year VARCHAR(10);


