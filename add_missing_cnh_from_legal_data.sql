-- Preenche CNH e veículo para candidatos existentes usando dados do formulário jurídico e padrões coerentes
-- Execute este script no Supabase (projeto de produção) com cuidado.

BEGIN;

-- 1) Se houver algum dado correlato em candidate_legal_data (não temos campo de CNH lá normalmente), este bloco fica como exemplo/placeholder
-- UPDATE candidates c
-- SET cnh = coalesce(c.cnh, 'NÃO POSSUI')
-- WHERE cnh IS NULL;

-- 2) Onde ainda estiver NULL, marcamos como 'NÃO POSSUI' para permitir filtros atuais.
UPDATE public.candidates
SET cnh = 'NÃO POSSUI'
WHERE cnh IS NULL;

-- 3) Opcional: normalizar veículo vazio como 'Não possuo'
UPDATE public.candidates
SET vehicle = 'Não possuo'
WHERE vehicle IS NULL OR trim(coalesce(vehicle, '')) = '';

COMMIT;


