-- =====================================================
-- SCRIPT PARA CORRIGIR PROBLEMA TIPO_SOLICITACAO
-- =====================================================
-- Copie e cole este script COMPLETO no Supabase SQL Editor

-- 1. VERIFICAR SE A COLUNA EXISTE
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'job_requests' 
AND column_name = 'tipo_solicitacao';

-- 2. VERIFICAR VALORES ATUAIS
SELECT tipo_solicitacao, COUNT(*) as quantidade
FROM public.job_requests 
GROUP BY tipo_solicitacao;

-- 3. CORRIGIR REGISTROS COM PROBLEMAS
-- Corrigir registros NULL
UPDATE public.job_requests 
SET tipo_solicitacao = 'aumento_quadro'
WHERE tipo_solicitacao IS NULL;

-- Corrigir registros vazios
UPDATE public.job_requests 
SET tipo_solicitacao = 'aumento_quadro'
WHERE tipo_solicitacao = '';

-- Corrigir registros que deveriam ser 'substituicao' baseado na justificativa
UPDATE public.job_requests 
SET tipo_solicitacao = 'substituicao'
WHERE tipo_solicitacao = 'aumento_quadro'
  AND (
    LOWER(justification) LIKE '%substituição%' 
    OR LOWER(justification) LIKE '%substituicao%'
    OR LOWER(justification) LIKE '%substituir%'
    OR LOWER(justification) LIKE '%saiu%'
    OR LOWER(justification) LIKE '%demitiu%'
  );

-- Corrigir registros que têm nome_substituido preenchido
UPDATE public.job_requests 
SET tipo_solicitacao = 'substituicao'
WHERE nome_substituido IS NOT NULL 
  AND nome_substituido != ''
  AND tipo_solicitacao = 'aumento_quadro';

-- 4. INSERIR REGISTRO DE TESTE
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
    'Teste de substituição',
    ARRAY['Ensino médio completo'],
    ARRAY['Vale refeição'],
    '40h/semana',
    'Substituição da colaboradora JESSICA PEREIRA SILVA',
    1,
    'João Silva Teste',
    'Gerente - CLT',
    'Observações de teste',
    'substituicao',
    'JESSICA PEREIRA SILVA',
    '00000000-0000-0000-0000-000000000000',
    'Usuário Teste',
    'pendente'
);

-- 5. VERIFICAR RESULTADO
SELECT 
    id,
    title,
    tipo_solicitacao,
    solicitante_nome,
    nome_substituido,
    created_at
FROM public.job_requests 
WHERE title LIKE 'TESTE%'
ORDER BY created_at DESC
LIMIT 5;

-- 6. VERIFICAR VALORES FINAIS
SELECT tipo_solicitacao, COUNT(*) as quantidade
FROM public.job_requests 
GROUP BY tipo_solicitacao;
