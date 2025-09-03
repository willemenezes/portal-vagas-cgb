-- Corrigir política RLS que está tentando acessar auth.users sem permissão
-- Remover a política problemática que tenta acessar auth.users

-- Remover a política que está causando o erro
DROP POLICY IF EXISTS "Candidatos podem visualizar seus dados" ON candidate_legal_data;

-- Política mais simples que não tenta acessar auth.users
CREATE POLICY "Candidatos podem visualizar seus dados" ON candidate_legal_data
  FOR SELECT
  USING (false); -- Por enquanto, não permitir que candidatos vejam seus dados diretamente
  -- Isso pode ser ajustado depois se necessário
