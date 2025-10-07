-- Script para encontrar a tabela correta de dados jurídicos
-- Execute este script para listar todas as tabelas e encontrar a correta

-- 1. Listar TODAS as tabelas do schema public
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Verificar se existe tabela com nome similar ao que vimos antes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name ILIKE '%candic%'
ORDER BY table_name;

-- 3. Verificar se existe tabela com nome similar ao que vimos antes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name ILIKE '%candidatc%'
ORDER BY table_name;

-- 4. Verificar se existe tabela com nome similar ao que vimos antes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name ILIKE '%candidat%'
ORDER BY table_name;

