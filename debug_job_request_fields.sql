-- Script para debugar campos de controle interno
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se as colunas existem
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'job_requests' 
AND column_name IN ('solicitante_nome', 'solicitante_funcao', 'observacoes_internas', 'tipo_solicitacao', 'nome_substituido')
ORDER BY column_name;

-- 2. Verificar dados de uma solicitação específica (substitua pelo ID da sua solicitação)
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
WHERE title = 'teste20' OR title = 'TESTE20'
ORDER BY created_at DESC 
LIMIT 1;

-- 3. Se os campos estiverem NULL, vamos atualizar com dados de teste
UPDATE public.job_requests 
SET 
    solicitante_nome = 'João Silva Teste',
    solicitante_funcao = 'Gerente de TI - CLT',
    observacoes_internas = 'Observações internas de teste',
    tipo_solicitacao = 'aumento_quadro'
WHERE title = 'teste20' OR title = 'TESTE20';

-- 4. Verificar novamente após a atualização
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
WHERE title = 'teste20' OR title = 'TESTE20'
ORDER BY created_at DESC 
LIMIT 1;
