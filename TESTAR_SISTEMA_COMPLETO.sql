-- =====================================================
-- SCRIPT DE TESTE COMPLETO: SISTEMA TIPO_SOLICITACAO
-- =====================================================
-- Execute este script para testar o sistema completo

-- 1. LIMPAR REGISTROS DE TESTE ANTERIORES
-- =====================================================
DELETE FROM public.job_requests 
WHERE title LIKE 'TESTE%' 
   OR title LIKE 'teste%';

-- 2. INSERIR TESTE 1: AUMENTO DE QUADRO
-- =====================================================
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
    'TESTE AUMENTO QUADRO - ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI:SS'),
    'Atendimento',
    'Belém',
    'PA',
    'CLT',
    'Teste de aumento de quadro',
    ARRAY['Ensino médio completo', 'Experiência'],
    ARRAY['Vale refeição', 'Plano de saúde'],
    '40h/semana',
    'Expansão da equipe de atendimento',
    2,
    'Maria Silva Teste',
    'Supervisora - CLT',
    'Observações para aumento de quadro',
    'aumento_quadro',
    NULL,
    '00000000-0000-0000-0000-000000000000',
    'Usuário Teste Aumento',
    'pendente'
);

-- 3. INSERIR TESTE 2: SUBSTITUIÇÃO
-- =====================================================
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
    ARRAY['Ensino médio completo', 'Experiência com atendimento'],
    ARRAY['Vale refeição', 'Plano de saúde', 'Plano odontológico'],
    '40h/semana',
    'Substituição da colaboradora JESSICA PEREIRA SILVA',
    1,
    'João Silva Teste',
    'Gerente de TI - CLT',
    'Observações para substituição',
    'substituicao',
    'JESSICA PEREIRA SILVA',
    '00000000-0000-0000-0000-000000000000',
    'Usuário Teste Substituição',
    'pendente'
);

-- 4. VERIFICAR SE OS TESTES FORAM INSERIDOS CORRETAMENTE
-- =====================================================
SELECT 
    id,
    title,
    tipo_solicitacao,
    solicitante_nome,
    nome_substituido,
    justification,
    created_at
FROM public.job_requests 
WHERE title LIKE 'TESTE%'
ORDER BY created_at DESC;

-- 5. VERIFICAR VALORES ÚNICOS APÓS OS TESTES
-- =====================================================
SELECT 
    tipo_solicitacao,
    COUNT(*) as quantidade
FROM public.job_requests 
GROUP BY tipo_solicitacao
ORDER BY quantidade DESC;

-- 6. VERIFICAR REGISTROS RECENTES (ÚLTIMOS 10)
-- =====================================================
SELECT 
    id,
    title,
    tipo_solicitacao,
    solicitante_nome,
    nome_substituido,
    created_at
FROM public.job_requests 
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- INSTRUÇÕES PARA TESTE NO SISTEMA:
-- =====================================================
-- 1. Execute este script no Supabase
-- 2. Verifique se os 2 registros de teste foram inseridos
-- 3. Acesse o sistema como Solicitador
-- 4. Crie uma nova solicitação:
--    - Selecione "Substituição"
--    - Preencha o campo "Nome da Pessoa que Saiu"
--    - Salve a solicitação
-- 5. Acesse o sistema como Gerência
-- 6. Verifique se aparece "Substituição" na tela de aprovação
-- 7. Verifique os logs no console do navegador
-- 8. Me informe os resultados
