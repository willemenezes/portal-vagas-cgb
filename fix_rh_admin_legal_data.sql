-- CORREÇÃO: Permitir RH Admin inserir dados jurídicos

-- 1. Primeiro, vamos garantir que RLS permita RH inserir dados
-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Permitir inserção de dados jurídicos" ON candidate_legal_data;
DROP POLICY IF EXISTS "RH pode gerenciar dados jurídicos" ON candidate_legal_data;
DROP POLICY IF EXISTS "Juridico pode revisar dados" ON candidate_legal_data;
DROP POLICY IF EXISTS "Candidatos podem visualizar seus dados" ON candidate_legal_data;
DROP POLICY IF EXISTS "Acesso total candidate_legal_data" ON candidate_legal_data;

-- 2. Criar política específica para RH INSERIR dados
CREATE POLICY "RH pode inserir dados juridicos" ON candidate_legal_data
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role IN ('admin', 'recruiter', 'manager')
    )
  );

-- 3. Criar política para RH VISUALIZAR dados
CREATE POLICY "RH pode visualizar dados juridicos" ON candidate_legal_data
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role IN ('admin', 'recruiter', 'manager')
    )
  );

-- 4. Criar política para RH ATUALIZAR dados (se necessário)
CREATE POLICY "RH pode atualizar dados juridicos" ON candidate_legal_data
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role IN ('admin', 'recruiter', 'manager')
    )
  );

-- 5. Criar política específica para JURÍDICO visualizar e aprovar
CREATE POLICY "Juridico pode gerenciar validacao" ON candidate_legal_data
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role = 'juridico'
    )
  );

-- 6. Verificar se as políticas foram criadas corretamente
SELECT 
  'Politicas criadas:' as status,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'candidate_legal_data'
ORDER BY policyname;

-- 7. Verificar se o usuário atual tem permissão
SELECT 
  'Status do usuario:' as info,
  auth.uid() as user_id,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role IN ('admin', 'recruiter', 'manager')
    ) THEN 'RH - PODE INSERIR'
    WHEN EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role = 'juridico'
    ) THEN 'JURIDICO - PODE APROVAR'
    ELSE 'SEM PERMISSAO - VERIFICAR rh_users'
  END as permissao;
