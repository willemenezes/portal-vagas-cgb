-- Adicionar campo de contrato da empresa na tabela candidate_legal_data
-- Este campo permite ao jurídico especificar de qual contrato da empresa o candidato está concorrendo

-- 1. Adicionar coluna company_contract na tabela candidate_legal_data
ALTER TABLE public.candidate_legal_data 
ADD COLUMN IF NOT EXISTS company_contract TEXT;

-- 2. Criar índice para performance em queries (opcional)
CREATE INDEX IF NOT EXISTS idx_candidate_legal_data_company_contract ON public.candidate_legal_data(company_contract);

-- 3. Comentário para documentação
COMMENT ON COLUMN public.candidate_legal_data.company_contract IS 'Contrato da empresa para o qual o candidato está concorrendo - visível apenas para o jurídico durante a fase de aprovação';

-- 4. Atualizar dados existentes (opcional - definir valor padrão se necessário)
-- UPDATE public.candidate_legal_data SET company_contract = 'Não especificado' WHERE company_contract IS NULL;

-- 5. Verificar se a coluna foi adicionada corretamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'candidate_legal_data' 
AND column_name = 'company_contract';
