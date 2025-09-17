-- =====================================================
-- CORRIGIR VAGAS COM ESTADO INCORRETO
-- =====================================================
-- Execute este script no Supabase SQL Editor

BEGIN;

-- 1. VERIFICAR VAGAS QUE NÃO DEVEM ESTAR ATIVAS (fora do Pará)
-- Se vocês só criam vagas no Pará, estas vagas podem estar incorretas
SELECT 
    id,
    title,
    city,
    state,
    created_at,
    'VERIFICAR: Esta vaga não deveria estar ativa?' as observacao
FROM public.jobs 
WHERE approval_status = 'active' 
  AND status = 'active'
  AND state != 'PA'
  AND city IS NOT NULL 
  AND city != ''
  AND city != 'Remoto'
  AND city != 'remoto'
  AND title != 'Banco de Talentos';

-- 2. OPÇÃO 1: DESATIVAR VAGAS FORA DO PARÁ (se não deveriam estar ativas)
-- Descomente as linhas abaixo se quiser desativar vagas fora do Pará:
/*
UPDATE public.jobs 
SET 
    status = 'draft',
    approval_status = 'draft',
    updated_at = NOW()
WHERE approval_status = 'active' 
  AND status = 'active'
  AND state != 'PA'
  AND city IS NOT NULL 
  AND city != ''
  AND city != 'Remoto'
  AND city != 'remoto'
  AND title != 'Banco de Talentos';
*/

-- 3. OPÇÃO 2: CORRIGIR ESTADO PARA PA (se as vagas deveriam estar no Pará)
-- Descomente e ajuste conforme necessário:
/*
-- Exemplo: Corrigir São Paulo para Belém (se for erro de cadastro)
UPDATE public.jobs 
SET 
    state = 'PA',
    city = 'Belém',  -- ou outra cidade do Pará
    updated_at = NOW()
WHERE id = 'ID_DA_VAGA_AQUI';
*/

-- 4. VERIFICAR RESULTADO APÓS CORREÇÃO
SELECT 
    state,
    COUNT(*) as quantidade_vagas,
    STRING_AGG(title, ', ') as titulos_vagas
FROM public.jobs 
WHERE approval_status = 'active' 
  AND status = 'active'
  AND city IS NOT NULL 
  AND city != ''
  AND city != 'Remoto'
  AND city != 'remoto'
  AND title != 'Banco de Talentos'
GROUP BY state
ORDER BY quantidade_vagas DESC;

COMMIT;
