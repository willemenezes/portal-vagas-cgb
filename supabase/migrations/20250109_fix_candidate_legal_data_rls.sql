-- Corrigir políticas RLS da tabela candidate_legal_data
-- Permitir inserção de dados quando candidatos se cadastram (sem autenticação)

-- Remover políticas existentes
DROP POLICY IF EXISTS "RH pode gerenciar dados jurídicos" ON candidate_legal_data;
DROP POLICY IF EXISTS "Juridico pode revisar dados" ON candidate_legal_data;

-- Política para inserção de dados (permitir inserção sem autenticação)
CREATE POLICY "Permitir inserção de dados jurídicos" ON candidate_legal_data
  FOR INSERT
  WITH CHECK (true); -- Permitir inserção para qualquer usuário

-- Política para RH (admin, recruiter, manager) - podem visualizar e atualizar
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

-- Política para candidatos visualizarem seus próprios dados (se necessário)
CREATE POLICY "Candidatos podem visualizar seus dados" ON candidate_legal_data
  FOR SELECT
  USING (
    candidate_id IN (
      SELECT id FROM candidates 
      WHERE email = (
        SELECT email FROM auth.users 
        WHERE auth.users.id = auth.uid()
      )
    )
  );
