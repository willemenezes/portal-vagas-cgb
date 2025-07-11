-- Corrige as permissões (RLS) para o perfil 'juridico' para permitir a validação.

-- 1. Permite que o perfil 'juridico' leia a tabela de vagas ('jobs').
-- A tela de validação precisa buscar informações da vaga associada ao candidato.
CREATE POLICY "Juridico pode visualizar vagas de candidatos"
ON public.jobs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rh_users
    WHERE rh_users.user_id = auth.uid() AND rh_users.role = 'juridico'
  )
);

-- 2. Garante que o perfil 'juridico' possa ler a tabela de candidatos ('candidates').
CREATE POLICY "Juridico pode visualizar candidatos para validação"
ON public.candidates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rh_users
    WHERE rh_users.user_id = auth.uid() AND rh_users.role = 'juridico'
  )
); 