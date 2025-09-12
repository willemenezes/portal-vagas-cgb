-- Teste para inserir uma solicitação com tipo_solicitacao = 'substituicao'
-- Execute este script no Supabase SQL Editor

-- Inserir uma solicitação de teste com substituição
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
    'TESTE SUBSTITUIÇÃO - ' || NOW()::text,
    'Atendimento',
    'Belém',
    'PA',
    'CLT',
    'Teste de substituição',
    ARRAY['Ensino médio', 'Experiência'],
    ARRAY['Vale refeição', 'Plano de saúde'],
    '40h/semana',
    'Substituição da colaboradora TESTE',
    1,
    'João Silva Teste',
    'Gerente - CLT',
    'Observações de teste',
    'substituicao',
    'Maria Santos Teste',
    '00000000-0000-0000-0000-000000000000',
    'Usuário Teste',
    'pendente'
);

-- Verificar se foi inserido corretamente
SELECT 
    id,
    title,
    tipo_solicitacao,
    solicitante_nome,
    nome_substituido,
    created_at
FROM public.job_requests 
WHERE title LIKE 'TESTE SUBSTITUIÇÃO%'
ORDER BY created_at DESC
LIMIT 5;
