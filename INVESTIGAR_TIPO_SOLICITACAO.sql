-- =====================================================
-- SCRIPT DE INVESTIGAÇÃO: PROBLEMA TIPO_SOLICITACAO
-- =====================================================
-- Execute este script completo no Supabase SQL Editor
-- para investigar por que "Substituição" aparece como "Aumento de Quadro"

-- 1. VERIFICAR ESTRUTURA DA COLUNA
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'job_requests' 
AND column_name = 'tipo_solicitacao';

-- 2. VERIFICAR VALORES ÚNICOS NA TABELA
-- =====================================================
SELECT 
    tipo_solicitacao,
    COUNT(*) as quantidade,
    MIN(created_at) as primeiro_registro,
    MAX(created_at) as ultimo_registro
FROM public.job_requests 
GROUP BY tipo_solicitacao
ORDER BY quantidade DESC;

-- 3. VERIFICAR REGISTROS RECENTES (ÚLTIMOS 7 DIAS)
-- =====================================================
SELECT 
    id,
    title,
    tipo_solicitacao,
    solicitante_nome,
    solicitante_funcao,
    observacoes_internas,
    nome_substituido,
    requested_by_name,
    created_at
FROM public.job_requests 
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;

-- 4. VERIFICAR SE HÁ REGISTROS COM 'substituicao'
-- =====================================================
SELECT 
    id,
    title,
    tipo_solicitacao,
    nome_substituido,
    solicitante_nome,
    created_at
FROM public.job_requests 
WHERE tipo_solicitacao = 'substituicao'
ORDER BY created_at DESC;

-- 5. VERIFICAR SE HÁ REGISTROS COM 'aumento_quadro'
-- =====================================================
SELECT 
    id,
    title,
    tipo_solicitacao,
    solicitante_nome,
    created_at
FROM public.job_requests 
WHERE tipo_solicitacao = 'aumento_quadro'
ORDER BY created_at DESC
LIMIT 10;

-- 6. VERIFICAR REGISTROS COM VALORES NULL OU VAZIOS
-- =====================================================
SELECT 
    id,
    title,
    tipo_solicitacao,
    solicitante_nome,
    created_at
FROM public.job_requests 
WHERE tipo_solicitacao IS NULL 
   OR tipo_solicitacao = ''
   OR tipo_solicitacao = 'null'
ORDER BY created_at DESC;

-- 7. VERIFICAR REGISTROS COM VALORES INESPERADOS
-- =====================================================
SELECT 
    id,
    title,
    tipo_solicitacao,
    solicitante_nome,
    created_at
FROM public.job_requests 
WHERE tipo_solicitacao NOT IN ('aumento_quadro', 'substituicao', NULL, '')
ORDER BY created_at DESC;

-- 8. INSERIR REGISTRO DE TESTE COM 'substituicao'
-- =====================================================
INSERT INTO public.job_requests (
    title,
    department,
    city,
    state,
    type,
    description,
    requirements,
    benefits,
    workload,
    justification,
    quantity,
    solicitante_nome,
    solicitante_funcao,
    observacoes_internas,
    tipo_solicitacao,
    nome_substituido,
    requested_by,
    requested_by_name,
    status
) VALUES (
    'TESTE SUBSTITUIÇÃO - ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI:SS'),
    'Atendimento',
    'Belém',
    'PA',
    'CLT',
    'Teste de substituição para investigação',
    ARRAY['Ensino médio completo', 'Experiência com atendimento'],
    ARRAY['Vale refeição', 'Plano de saúde', 'Plano odontológico'],
    '40h/semana',
    'Substituição da colaboradora JESSICA PEREIRA SILVA',
    1,
    'João Silva Teste',
    'Gerente de TI - CLT',
    'Observações internas de teste para investigação',
    'substituicao',
    'Maria Santos Teste',
    '00000000-0000-0000-0000-000000000000',
    'Usuário Teste',
    'pendente'
);

-- 9. VERIFICAR SE O REGISTRO DE TESTE FOI INSERIDO CORRETAMENTE
-- =====================================================
SELECT 
    id,
    title,
    tipo_solicitacao,
    solicitante_nome,
    nome_substituido,
    created_at
FROM public.job_requests 
WHERE title LIKE 'TESTE SUBSTITUIÇÃO%'
ORDER BY created_at DESC
LIMIT 5;

-- 10. VERIFICAR TODOS OS CAMPOS DE CONTROLE INTERNO
-- =====================================================
SELECT 
    id,
    title,
    solicitante_nome,
    solicitante_funcao,
    observacoes_internas,
    tipo_solicitacao,
    nome_substituido,
    created_at
FROM public.job_requests 
WHERE created_at >= NOW() - INTERVAL '3 days'
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- INSTRUÇÕES:
-- =====================================================
-- 1. Execute este script completo no Supabase SQL Editor
-- 2. Verifique os resultados de cada seção
-- 3. Me informe:
--    - Se a coluna tipo_solicitacao existe
--    - Quais valores únicos existem na tabela
--    - Se há registros com 'substituicao'
--    - Se o registro de teste foi inserido corretamente
-- 4. Com base nos resultados, identificaremos onde está o problema
