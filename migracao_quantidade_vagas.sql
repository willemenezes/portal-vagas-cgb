-- Migração: Sistema de Quantidade e Validade de Vagas
-- Data: Janeiro 2025

-- 1. Adicionar campos na tabela job_requests
ALTER TABLE public.job_requests 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Adicionar campos na tabela jobs
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS quantity_filled INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON public.jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_job_requests_expires_at ON public.job_requests(expires_at);

-- 4. Função para calcular data de expiração (20 dias corridos)
CREATE OR REPLACE FUNCTION calculate_expiry_date()
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE SQL
AS $$
  SELECT (NOW() + INTERVAL '20 days');
$$;

-- 5. Trigger para definir data de expiração automaticamente nos job_requests
CREATE OR REPLACE FUNCTION set_job_request_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := calculate_expiry_date();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_set_job_request_expiry
  BEFORE INSERT ON public.job_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_job_request_expiry();

-- 6. Trigger para definir data de expiração automaticamente nos jobs
CREATE OR REPLACE FUNCTION set_job_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := calculate_expiry_date();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_set_job_expiry
  BEFORE INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_job_expiry();

-- 7. View para vagas com status de expiração
CREATE OR REPLACE VIEW public.jobs_with_expiry_status AS
SELECT 
  j.*,
  CASE 
    WHEN j.expires_at < NOW() THEN 'expired'
    WHEN j.expires_at < (NOW() + INTERVAL '3 days') THEN 'expiring_soon'
    ELSE 'active'
  END as expiry_status,
  EXTRACT(DAYS FROM (j.expires_at - NOW())) as days_until_expiry,
  (j.quantity - j.quantity_filled) as remaining_positions
FROM public.jobs j;

-- 8. View para relatórios de expiração
CREATE OR REPLACE VIEW public.expiry_report AS
SELECT 
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_jobs,
  COUNT(*) FILTER (WHERE expires_at < (NOW() + INTERVAL '3 days') AND expires_at >= NOW()) as expiring_soon,
  COUNT(*) FILTER (WHERE expires_at >= (NOW() + INTERVAL '3 days')) as active_jobs,
  COUNT(*) as total_jobs,
  SUM(quantity) as total_positions,
  SUM(quantity_filled) as filled_positions,
  SUM(quantity - quantity_filled) as remaining_positions
FROM public.jobs
WHERE status = 'active';

-- 9. Comentários para documentação
COMMENT ON COLUMN public.job_requests.quantity IS 'Quantidade de vagas solicitadas para a mesma posição';
COMMENT ON COLUMN public.job_requests.expires_at IS 'Data de expiração da solicitação (20 dias corridos)';
COMMENT ON COLUMN public.jobs.quantity IS 'Quantidade total de vagas disponíveis';
COMMENT ON COLUMN public.jobs.quantity_filled IS 'Quantidade de vagas já preenchidas';
COMMENT ON COLUMN public.jobs.expires_at IS 'Data de expiração da vaga (20 dias corridos)';











