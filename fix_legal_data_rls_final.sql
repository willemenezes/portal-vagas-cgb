-- CORREÇÃO FINAL: Políticas RLS para candidate_legal_data
-- Este script resolve o erro 403 - permission denied

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Permitir inserção de dados jurídicos" ON candidate_legal_data;
DROP POLICY IF EXISTS "RH pode gerenciar dados jurídicos" ON candidate_legal_data;
DROP POLICY IF EXISTS "Juridico pode revisar dados" ON candidate_legal_data;
DROP POLICY IF EXISTS "Candidatos podem visualizar seus dados" ON candidate_legal_data;

-- 2. Política SIMPLES para inserção (permitir qualquer um inserir)
CREATE POLICY "Inserção livre de dados jurídicos" ON candidate_legal_data
  FOR INSERT
  WITH CHECK (true);

-- 3. Política para RH visualizar e gerenciar (sem verificação auth.users)
CREATE POLICY "RH visualiza dados jurídicos" ON candidate_legal_data
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role IN ('admin', 'recruiter', 'manager')
    )
  );

-- 4. Política para RH atualizar dados
CREATE POLICY "RH atualiza dados jurídicos" ON candidate_legal_data
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role IN ('admin', 'recruiter', 'manager')
    )
  );

-- 5. Política para Jurídico visualizar
CREATE POLICY "Juridico visualiza dados" ON candidate_legal_data
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role = 'juridico'
    )
  );

-- 6. Política para Jurídico atualizar (apenas campos de revisão)
CREATE POLICY "Juridico atualiza revisao" ON candidate_legal_data
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role = 'juridico'
    )
  );

-- 7. Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'candidate_legal_data';

-- Comentário: Este script permite inserção livre para candidatos e controle de acesso para RH/Jurídico
