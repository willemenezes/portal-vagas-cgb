-- Script para testar se os campos de controle interno estão funcionando
-- Execute este script no Supabase SQL Editor

-- Verificar estrutura atual da tabela job_requests
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'job_requests' 
AND column_name IN ('solicitante_nome', 'solicitante_funcao', 'observacoes_internas', 'tipo_solicitacao', 'nome_substituido')
ORDER BY column_name;

-- Verificar dados de uma solicitação recente (substitua pelo ID da sua solicitação de teste)
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
ORDER BY created_at DESC 
LIMIT 5;
