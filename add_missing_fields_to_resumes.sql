-- Adicionar campos faltantes na tabela resumes para igualar com candidatura direta
-- Execute este script no Supabase SQL Editor

-- Adicionar campos que faltam na tabela resumes
ALTER TABLE public.resumes 
ADD COLUMN IF NOT EXISTS age VARCHAR(3),
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
ADD COLUMN IF NOT EXISTS workedAtCGB VARCHAR(10),
ADD COLUMN IF NOT EXISTS pcd VARCHAR(10),
ADD COLUMN IF NOT EXISTS travel VARCHAR(10),
ADD COLUMN IF NOT EXISTS vehicle VARCHAR(20),
ADD COLUMN IF NOT EXISTS vehicleModel VARCHAR(50),
ADD COLUMN IF NOT EXISTS vehicleYear VARCHAR(4);

-- Comentários para documentar as colunas
COMMENT ON COLUMN public.resumes.age IS 'Idade do candidato';
COMMENT ON COLUMN public.resumes.whatsapp IS 'Número do WhatsApp';
COMMENT ON COLUMN public.resumes.workedAtCGB IS 'Se já trabalhou na CGB: Sim/Não';
COMMENT ON COLUMN public.resumes.pcd IS 'Pessoa com deficiência: Sim/Não';
COMMENT ON COLUMN public.resumes.travel IS 'Disponibilidade para viagens: Sim/Não';
COMMENT ON COLUMN public.resumes.vehicle IS 'Tipo de veículo: Carro/Moto/Não possuo';
COMMENT ON COLUMN public.resumes.vehicleModel IS 'Modelo do veículo';
COMMENT ON COLUMN public.resumes.vehicleYear IS 'Ano do veículo';

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'resumes' 
AND table_schema = 'public'
AND column_name IN ('age', 'whatsapp', 'workedAtCGB', 'pcd', 'travel', 'vehicle', 'vehicleModel', 'vehicleYear')
ORDER BY ordinal_position;
