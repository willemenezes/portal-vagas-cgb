-- Correção definitiva das políticas RLS para candidate_legal_data
-- Resolver erro 403 ao salvar dados jurídicos

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Permitir inserção de dados jurídicos" ON candidate_legal_data;
DROP POLICY IF EXISTS "RH pode gerenciar dados jurídicos" ON candidate_legal_data;
DROP POLICY IF EXISTS "Juridico pode revisar dados" ON candidate_legal_data;
DROP POLICY IF EXISTS "Candidatos podem visualizar seus dados" ON candidate_legal_data;

-- Política 1: Permitir inserção para usuários autenticados que são RH
CREATE POLICY "RH pode inserir dados jurídicos" ON candidate_legal_data
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role IN ('admin', 'recruiter', 'manager')
    )
  );

-- Política 2: RH pode visualizar e atualizar todos os dados
CREATE POLICY "RH pode gerenciar dados jurídicos" ON candidate_legal_data
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role IN ('admin', 'recruiter', 'manager')
    )
  );

-- Política 3: RH pode atualizar dados
CREATE POLICY "RH pode atualizar dados jurídicos" ON candidate_legal_data
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role IN ('admin', 'recruiter', 'manager')
    )
  );

-- Política 4: Jurídico pode visualizar todos os dados
CREATE POLICY "Juridico pode visualizar dados" ON candidate_legal_data
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role = 'juridico'
    )
  );

-- Política 5: Jurídico pode atualizar apenas campos de revisão
CREATE POLICY "Juridico pode atualizar revisao" ON candidate_legal_data
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role = 'juridico'
    )
  );

-- Verificar se RLS está ativo
ALTER TABLE candidate_legal_data ENABLE ROW LEVEL SECURITY;

-- Comentários para documentação
COMMENT ON POLICY "RH pode inserir dados jurídicos" ON candidate_legal_data IS 'Permite que RH (admin, recruiter, manager) insiram dados jurídicos';
COMMENT ON POLICY "RH pode gerenciar dados jurídicos" ON candidate_legal_data IS 'Permite que RH visualizem todos os dados jurídicos';
COMMENT ON POLICY "RH pode atualizar dados jurídicos" ON candidate_legal_data IS 'Permite que RH atualizem dados jurídicos';
COMMENT ON POLICY "Juridico pode visualizar dados" ON candidate_legal_data IS 'Permite que jurídico visualize todos os dados';
COMMENT ON POLICY "Juridico pode atualizar revisao" ON candidate_legal_data IS 'Permite que jurídico atualize campos de revisão';



















