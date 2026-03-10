-- Adiciona coluna accepting_applications à tabela jobs
-- Quando FALSE, a vaga continua visível no site mas bloqueia novas candidaturas

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS accepting_applications boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN jobs.accepting_applications IS
  'Controla se a vaga está aceitando novas candidaturas. TRUE = aberta, FALSE = candidaturas pausadas. A vaga permanece visível no site e ativa internamente.';
