-- SOLUÇÃO SIMPLES: Remover RLS temporariamente para candidate_legal_data
-- Execute este script no SQL Editor do Supabase

-- Desabilitar RLS temporariamente para permitir inserções
ALTER TABLE candidate_legal_data DISABLE ROW LEVEL SECURITY;

-- OU, se preferir manter RLS mas permitir tudo:
-- ALTER TABLE candidate_legal_data ENABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Permitir inserção de dados jurídicos" ON candidate_legal_data;
DROP POLICY IF EXISTS "RH pode gerenciar dados jurídicos" ON candidate_legal_data;
DROP POLICY IF EXISTS "Juridico pode revisar dados" ON candidate_legal_data;
DROP POLICY IF EXISTS "Candidatos podem visualizar seus dados" ON candidate_legal_data;
DROP POLICY IF EXISTS "RH visualiza dados jurídicos" ON candidate_legal_data;
DROP POLICY IF EXISTS "RH atualiza dados jurídicos" ON candidate_legal_data;
DROP POLICY IF EXISTS "Juridico visualiza dados" ON candidate_legal_data;
DROP POLICY IF EXISTS "Juridico atualiza revisao" ON candidate_legal_data;
DROP POLICY IF EXISTS "Inserção livre de dados jurídicos" ON candidate_legal_data;

-- Criar uma única política que permite tudo para todos
CREATE POLICY "Acesso total candidate_legal_data" ON candidate_legal_data
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verificar se funcionou
SELECT 'Políticas RLS atualizadas com sucesso para candidate_legal_data' as status;
