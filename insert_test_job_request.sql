-- Script para inserir uma solicitação de teste com dados de controle interno
-- Execute este script no Supabase SQL Editor

-- Inserir uma solicitação de teste com todos os campos de controle interno
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
    requested_by,
    requested_by_name,
    status,
    solicitante_nome,
    solicitante_funcao,
    observacoes_internas,
    tipo_solicitacao,
    nome_substituido
) VALUES (
    'TESTE CONTROLE INTERNO',
    'Técnico em Saneamento',
    'Santarém',
    'PA',
    'CLT',
    'Descrição de teste para verificar campos de controle interno',
    ARRAY['Requisito 1', 'Requisito 2'],
    ARRAY['Benefício 1', 'Benefício 2'],
    '44h/semana',
    'Justificativa de teste',
    '00000000-0000-0000-0000-000000000000', -- Substitua pelo ID do usuário atual
    'Usuário Teste',
    'pendente',
    'João Silva Teste',
    'Gerente de TI - CLT',
    'Observações internas de teste para verificar se aparecem no modal',
    'aumento_quadro',
    NULL
);

-- Verificar se foi inserido corretamente
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
WHERE title = 'TESTE CONTROLE INTERNO'
ORDER BY created_at DESC 
LIMIT 1;
