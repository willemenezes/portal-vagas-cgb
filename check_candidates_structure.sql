-- Script para verificar a estrutura da tabela candidatos
-- Execute este script para ver se os dados jurídicos estão na própria tabela candidatos

-- 1. Verificar estrutura da tabela candidatos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'candidatos' 
ORDER BY ordinal_position;

-- 2. Verificar se existe coluna review_status na tabela candidatos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'candidatos' 
  AND column_name ILIKE '%review%'
ORDER BY column_name;

-- 3. Verificar se existe coluna legal na tabela candidatos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'candidatos' 
  AND column_name ILIKE '%legal%'
ORDER BY column_name;

-- 4. Verificar se existe coluna status na tabela candidatos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'candidatos' 
  AND column_name ILIKE '%status%'
ORDER BY column_name;

