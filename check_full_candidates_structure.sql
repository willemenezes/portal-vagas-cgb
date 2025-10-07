-- Script para verificar a estrutura completa da tabela candidatos
-- Execute este script para ver todas as colunas disponíveis

-- 1. Verificar TODAS as colunas da tabela candidatos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'candidatos' 
ORDER BY ordinal_position;

-- 2. Verificar se existe coluna com nome diferente para status
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'candidatos' 
  AND (column_name ILIKE '%situacao%' OR column_name ILIKE '%estado%' OR column_name ILIKE '%condicao%')
ORDER BY column_name;

-- 3. Verificar se existe coluna com nome diferente para review
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'candidatos' 
  AND (column_name ILIKE '%aprovacao%' OR column_name ILIKE '%validacao%' OR column_name ILIKE '%analise%')
ORDER BY column_name;

