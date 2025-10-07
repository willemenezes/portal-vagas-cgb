-- Script para encontrar a tabela correta de dados jurídicos
-- Execute este script para listar todas as tabelas disponíveis

-- 1. Listar TODAS as tabelas do schema public
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Buscar tabelas que contenham 'legal' em qualquer parte
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name ILIKE '%legal%'
ORDER BY table_name;

-- 3. Buscar tabelas que contenham 'candidate' em qualquer parte
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name ILIKE '%candidate%'
ORDER BY table_name;

-- 4. Verificar se existe alguma tabela relacionada a dados jurídicos
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name ILIKE '%juridico%' OR table_name ILIKE '%validation%' OR table_name ILIKE '%review%')
ORDER BY table_name;

