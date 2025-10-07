-- Script para verificar TODAS as colunas da tabela candidatos
-- Execute este script para ver a estrutura completa

-- 1. Verificar TODAS as colunas da tabela candidatos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'candidatos' 
ORDER BY ordinal_position;

-- 2. Verificar se existe alguma tabela que contenha dados jurídicos
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name ILIKE '%legal%'
ORDER BY table_name;

-- 3. Verificar se existe alguma tabela que contenha validação
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name ILIKE '%validacao%'
ORDER BY table_name;

