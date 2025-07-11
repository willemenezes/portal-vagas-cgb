-- Criar tabela para dados jurídicos dos candidatos
CREATE TABLE IF NOT EXISTS candidate_legal_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  
  -- Dados Pessoais (alguns serão criptografados)
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
  
  -- Controle e Auditoria
  collected_by UUID REFERENCES auth.users(id),
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_status TEXT CHECK (review_status IN ('pending', 'approved', 'rejected', 'request_changes')),
  review_notes TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir apenas um registro por candidato
  UNIQUE(candidate_id)
);

-- Criar índices para melhor performance
CREATE INDEX idx_candidate_legal_data_candidate_id ON candidate_legal_data(candidate_id);
CREATE INDEX idx_candidate_legal_data_review_status ON candidate_legal_data(review_status);

-- Habilitar RLS
ALTER TABLE candidate_legal_data ENABLE ROW LEVEL SECURITY;

-- Política para RH (admin, recruiter, manager) - podem inserir e visualizar
CREATE POLICY "RH pode gerenciar dados jurídicos" ON candidate_legal_data
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role IN ('admin', 'recruiter', 'manager')
    )
  );

-- Política específica para Jurídico - pode visualizar e atualizar status de revisão
CREATE POLICY "Juridico pode revisar dados" ON candidate_legal_data
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role = 'juridico'
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_candidate_legal_data_updated_at
  BEFORE UPDATE ON candidate_legal_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE candidate_legal_data IS 'Armazena dados sensíveis dos candidatos para validação jurídica';
COMMENT ON COLUMN candidate_legal_data.cpf IS 'CPF do candidato - deve ser armazenado com criptografia em produção';
COMMENT ON COLUMN candidate_legal_data.rg IS 'RG do candidato - deve ser armazenado com criptografia em produção';
COMMENT ON COLUMN candidate_legal_data.work_history IS 'Histórico profissional em formato JSON: [{company, position, start_date, end_date, is_current}]'; 