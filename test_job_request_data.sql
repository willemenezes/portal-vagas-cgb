-- Script para testar se os dados de controle interno estão sendo salvos
-- Execute este script no Supabase SQL Editor

-- Verificar dados da solicitação "teste20" (ou a mais recente)
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
WHERE title LIKE '%teste%' OR title LIKE '%TESTE%'
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar se as colunas existem na tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'job_requests' 
AND column_name IN ('solicitante_nome', 'solicitante_funcao', 'observacoes_internas', 'tipo_solicitacao', 'nome_substituido')
ORDER BY column_name;
