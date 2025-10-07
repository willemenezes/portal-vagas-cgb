-- Script para verificar o nome correto da tabela de dados jurídicos
-- Execute este script para encontrar a tabela correta

-- 1. Listar todas as tabelas que contêm 'legal' ou 'candidate'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name ILIKE '%legal%' OR table_name ILIKE '%candidate%')
ORDER BY table_name;

-- 2. Verificar se existe tabela com 'candidate_legal'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name ILIKE '%candidate_legal%'
ORDER BY table_name;

-- 3. Verificar estrutura da tabela candidatos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'candidatos' 
ORDER BY ordinal_position;

-- 4. Buscar por tabelas que possam conter dados jurídicos
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name ILIKE '%data%'
ORDER BY table_name;

