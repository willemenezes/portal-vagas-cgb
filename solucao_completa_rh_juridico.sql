-- SOLUÇÃO COMPLETA: RH Admin inserir dados jurídicos

-- ETAPA 1: Verificar se o usuário atual é RH Admin
DO $$
DECLARE
    current_user_id UUID := auth.uid();
    user_role TEXT;
BEGIN
    -- Buscar role do usuário atual
    SELECT role INTO user_role 
    FROM rh_users 
    WHERE user_id = current_user_id;
    
    RAISE NOTICE 'Usuario atual: %, Role: %', current_user_id, COALESCE(user_role, 'NAO ENCONTRADO');
END $$;

-- ETAPA 2: Limpar políticas existentes
DROP POLICY IF EXISTS "Permitir inserção de dados jurídicos" ON candidate_legal_data;
DROP POLICY IF EXISTS "RH pode gerenciar dados jurídicos" ON candidate_legal_data;
DROP POLICY IF EXISTS "Juridico pode revisar dados" ON candidate_legal_data;
DROP POLICY IF EXISTS "Candidatos podem visualizar seus dados" ON candidate_legal_data;
DROP POLICY IF EXISTS "Acesso total candidate_legal_data" ON candidate_legal_data;
DROP POLICY IF EXISTS "RH pode inserir dados juridicos" ON candidate_legal_data;
DROP POLICY IF EXISTS "RH pode visualizar dados juridicos" ON candidate_legal_data;
DROP POLICY IF EXISTS "RH pode atualizar dados juridicos" ON candidate_legal_data;
DROP POLICY IF EXISTS "Juridico pode gerenciar validacao" ON candidate_legal_data;

-- ETAPA 3: Criar políticas específicas e funcionais

-- Política para RH INSERIR dados jurídicos
CREATE POLICY "RH_pode_inserir_dados_juridicos" ON candidate_legal_data
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role IN ('admin', 'recruiter', 'manager')
    )
  );

-- Política para RH VISUALIZAR dados jurídicos  
CREATE POLICY "RH_pode_visualizar_dados_juridicos" ON candidate_legal_data
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role IN ('admin', 'recruiter', 'manager')
    )
  );

-- Política para RH ATUALIZAR dados jurídicos
CREATE POLICY "RH_pode_atualizar_dados_juridicos" ON candidate_legal_data
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role IN ('admin', 'recruiter', 'manager')
    )
  );

-- Política para JURÍDICO gerenciar validação (todas as operações)
CREATE POLICY "Juridico_pode_gerenciar_validacao" ON candidate_legal_data
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rh_users
      WHERE rh_users.user_id = auth.uid()
      AND rh_users.role = 'juridico'
    )
  );

-- ETAPA 4: Verificar se as políticas foram criadas
SELECT 
  'Politicas RLS criadas:' as status,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'candidate_legal_data'
ORDER BY policyname;

-- ETAPA 5: Teste final de permissão
SELECT 
  'Status final do usuario:' as info,
  auth.uid() as user_id,
  (SELECT email FROM rh_users WHERE user_id = auth.uid()) as email_rh,
  (SELECT role FROM rh_users WHERE user_id = auth.uid()) as role_rh,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM rh_users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'recruiter', 'manager')
    ) THEN '✅ PODE INSERIR DADOS JURIDICOS'
    WHEN EXISTS (
      SELECT 1 FROM rh_users
      WHERE user_id = auth.uid()
      AND role = 'juridico'
    ) THEN '✅ PODE APROVAR VALIDACAO'
    ELSE '❌ SEM PERMISSAO - VERIFICAR CADASTRO'
  END as permissao_final;

-- Mensagem de sucesso
SELECT '🎉 Configuração concluída! RH Admin agora pode inserir dados jurídicos.' as resultado;
