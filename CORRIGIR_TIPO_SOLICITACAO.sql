-- =====================================================
-- SCRIPT DE CORREÇÃO: TIPO_SOLICITACAO
-- =====================================================
-- Execute este script APENAS se o script de investigação
-- mostrar que há problemas nos dados

-- 1. VERIFICAR SE A COLUNA EXISTE E ESTÁ CORRETA
-- =====================================================
-- Se a coluna não existir, execute:
-- ALTER TABLE public.job_requests 
-- ADD COLUMN IF NOT EXISTS tipo_solicitacao VARCHAR(20) DEFAULT 'aumento_quadro';

-- 2. CORRIGIR VALORES INCORRETOS (se necessário)
-- =====================================================
-- Se houver registros com valores incorretos, execute:

-- Corrigir registros com valor NULL para 'aumento_quadro'
UPDATE public.job_requests 
SET tipo_solicitacao = 'aumento_quadro'
WHERE tipo_solicitacao IS NULL;

-- Corrigir registros com string vazia para 'aumento_quadro'
UPDATE public.job_requests 
SET tipo_solicitacao = 'aumento_quadro'
WHERE tipo_solicitacao = '';

-- Corrigir registros com 'null' (string) para 'aumento_quadro'
UPDATE public.job_requests 
SET tipo_solicitacao = 'aumento_quadro'
WHERE tipo_solicitacao = 'null';

-- 3. VERIFICAR SE HÁ REGISTROS QUE DEVERIAM SER 'substituicao'
-- =====================================================
-- Se a justificativa contém "substituição" mas o tipo está como "aumento_quadro":

UPDATE public.job_requests 
SET tipo_solicitacao = 'substituicao'
WHERE tipo_solicitacao = 'aumento_quadro'
  AND (
    LOWER(justification) LIKE '%substituição%' 
    OR LOWER(justification) LIKE '%substituicao%'
    OR LOWER(justification) LIKE '%substituir%'
    OR LOWER(justification) LIKE '%saiu%'
    OR LOWER(justification) LIKE '%demitiu%'
  );

-- 4. VERIFICAR SE HÁ REGISTROS COM nome_substituido PREENCHIDO
-- =====================================================
-- Se nome_substituido está preenchido, o tipo deveria ser 'substituicao':

UPDATE public.job_requests 
SET tipo_solicitacao = 'substituicao'
WHERE nome_substituido IS NOT NULL 
  AND nome_substituido != ''
  AND tipo_solicitacao = 'aumento_quadro';

-- 5. VERIFICAR RESULTADO DAS CORREÇÕES
-- =====================================================
SELECT 
    tipo_solicitacao,
    COUNT(*) as quantidade
FROM public.job_requests 
GROUP BY tipo_solicitacao
ORDER BY quantidade DESC;

-- 6. VERIFICAR REGISTROS RECENTES APÓS CORREÇÃO
-- =====================================================
SELECT 
    id,
    title,
    tipo_solicitacao,
    nome_substituido,
    justification,
    created_at
FROM public.job_requests 
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- INSTRUÇÕES:
-- =====================================================
-- 1. Execute PRIMEIRO o script INVESTIGAR_TIPO_SOLICITACAO.sql
-- 2. Analise os resultados
-- 3. Execute este script APENAS se necessário
-- 4. Me informe os resultados para continuarmos a investigação
