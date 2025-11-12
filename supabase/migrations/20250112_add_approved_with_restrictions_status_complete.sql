-- Script completo: Criar tabela se não existir e adicionar 'approved_with_restrictions'
-- Este script é seguro para executar mesmo se a tabela já existir

-- 1. Criar tabela candidate_legal_data se não existir
CREATE TABLE IF NOT EXISTS public.candidate_legal_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  
  -- Dados Pessoais
  full_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  rg TEXT NOT NULL,
  cpf TEXT NOT NULL,
  mother_name TEXT NOT NULL,
  father_name TEXT,
  birth_city TEXT NOT NULL,
  birth_state TEXT NOT NULL,
  
  -- Histórico Profissional (JSON)
  work_history JSONB DEFAULT '[]'::jsonb,
  
  -- Informações Adicionais
  is_former_employee BOOLEAN DEFAULT false,
  former_employee_details TEXT,
  is_pcd BOOLEAN DEFAULT false,
  pcd_details TEXT,
  desired_position TEXT NOT NULL,
  responsible_name TEXT,
  cnh TEXT,
  company_contract TEXT,
  
  -- Controle e Auditoria
  collected_by UUID REFERENCES auth.users(id),
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_status TEXT,
  review_notes TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir apenas um registro por candidato
  UNIQUE(candidate_id)
);

-- 2. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_candidate_legal_data_candidate_id ON public.candidate_legal_data(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_legal_data_review_status ON public.candidate_legal_data(review_status);
CREATE INDEX IF NOT EXISTS idx_candidate_legal_data_company_contract ON public.candidate_legal_data(company_contract);

-- 3. Remover constraint antiga se existir
ALTER TABLE public.candidate_legal_data 
DROP CONSTRAINT IF EXISTS candidate_legal_data_review_status_check;

-- 4. Adicionar a nova constraint com 'approved_with_restrictions'
ALTER TABLE public.candidate_legal_data 
ADD CONSTRAINT candidate_legal_data_review_status_check 
CHECK (review_status IN ('pending', 'approved', 'rejected', 'request_changes', 'approved_with_restrictions'));

-- 5. Habilitar RLS se não estiver habilitado
ALTER TABLE public.candidate_legal_data ENABLE ROW LEVEL SECURITY;

-- 6. Migrar registros existentes: se approved com review_notes ou legal_validation_comment, atualizar para approved_with_restrictions
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

