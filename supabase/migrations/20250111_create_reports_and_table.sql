-- Criar bucket de Storage para relatórios de candidatos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'reports'
  ) THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', true);
  END IF;
END $$;

-- Tabela para registrar relatórios gerados por candidato
CREATE TABLE IF NOT EXISTS public.candidate_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_id UUID NULL REFERENCES public.jobs(id) ON DELETE SET NULL,
  report_url TEXT NOT NULL,
  report_file_name TEXT NOT NULL,
  generated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_candidate_reports_candidate_id ON public.candidate_reports(candidate_id);

-- Habilitar RLS
ALTER TABLE public.candidate_reports ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
-- 1) RH/Jurídico/Admin podem ler e inserir
DROP POLICY IF EXISTS "RH pode gerenciar relatórios" ON public.candidate_reports;
CREATE POLICY "RH pode gerenciar relatórios" ON public.candidate_reports
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.rh_users r
      WHERE r.user_id = auth.uid()
      AND r.role IN ('admin','recruiter','manager','juridico')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rh_users r
      WHERE r.user_id = auth.uid()
      AND r.role IN ('admin','recruiter','manager','juridico')
    )
  );

-- 2) O próprio candidato autenticado pode ler relatórios dele (opcional)
DROP POLICY IF EXISTS "Candidato pode ler seus relatórios" ON public.candidate_reports;
CREATE POLICY "Candidato pode ler seus relatórios" ON public.candidate_reports
  FOR SELECT
  TO authenticated
  USING (
    candidate_id IN (
      SELECT c.id FROM public.candidates c
      WHERE c.email = (
        SELECT u.email FROM auth.users u WHERE u.id = auth.uid()
      )
    )
  );

-- Comentários
COMMENT ON TABLE public.candidate_reports IS 'Registra PDFs de relatórios de processo seletivo gerados para cada candidato';
COMMENT ON COLUMN public.candidate_reports.metadata IS 'Campos adicionais: versão do template, hash, etc.';







