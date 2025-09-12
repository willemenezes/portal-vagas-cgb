-- Verificar dados de tipo_solicitacao na tabela job_requests
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a coluna existe e seus valores
SELECT 
    id,
    title,
    tipo_solicitacao,
    solicitante_nome,
    solicitante_funcao,
    observacoes_internas,
    nome_substituido,
    created_at
FROM public.job_requests 
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Verificar valores únicos de tipo_solicitacao
SELECT 
    tipo_solicitacao,
    COUNT(*) as quantidade
FROM public.job_requests 
GROUP BY tipo_solicitacao
ORDER BY quantidade DESC;

-- 3. Verificar se há registros com tipo_solicitacao = 'substituicao'
SELECT 
    id,
    title,
    tipo_solicitacao,
    nome_substituido,
    created_at
FROM public.job_requests 
WHERE tipo_solicitacao = 'substituicao'
ORDER BY created_at DESC;

-- 4. Verificar estrutura da coluna
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'job_requests' 
AND column_name = 'tipo_solicitacao';
