-- =====================================================
-- VERIFICAR SOLICITAÇÃO TESTE1010
-- =====================================================
-- Execute este script no Supabase SQL Editor

-- 1. BUSCAR A SOLICITAÇÃO TESTE1010
SELECT 
    id,
    title,
    tipo_solicitacao,
    solicitante_nome,
    solicitante_funcao,
    observacoes_internas,
    nome_substituido,
    justification,
    created_at
FROM public.job_requests 
WHERE title = 'TESTE1010'
ORDER BY created_at DESC
LIMIT 5;

-- 2. VERIFICAR TODAS AS SOLICITAÇÕES RECENTES
SELECT 
    id,
    title,
    tipo_solicitacao,
    solicitante_nome,
    nome_substituido,
    justification,
    created_at
FROM public.job_requests 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- 3. VERIFICAR VALORES ÚNICOS DE tipo_solicitacao
SELECT 
    tipo_solicitacao,
    COUNT(*) as quantidade
FROM public.job_requests 
GROUP BY tipo_solicitacao
ORDER BY quantidade DESC;

-- 4. VERIFICAR SE HÁ REGISTROS COM 'substituição' (com acento)
SELECT 
    id,
    title,
    tipo_solicitacao,
    created_at
FROM public.job_requests 
WHERE tipo_solicitacao = 'substituição'
ORDER BY created_at DESC
LIMIT 5;

-- 5. VERIFICAR SE HÁ REGISTROS COM 'substituicao' (sem acento)
SELECT 
    id,
    title,
    tipo_solicitacao,
    created_at
FROM public.job_requests 
WHERE tipo_solicitacao = 'substituicao'
ORDER BY created_at DESC
LIMIT 5;
