-- Script para corrigir a vaga "Analista Operacional - Altamir"
-- ID: 1c84f01a-c28a-4e55-80d5-4f8c4ea2ae82
-- Problema: Vaga estava congelada, foi ativada mas ficou como draft sem ir para aprovação

-- 1. Verificar o status atual da vaga
SELECT 
    id,
    title,
    department,
    city,
    state,
    status,
    approval_status,
    flow_status,
    created_at,
    updated_at
FROM public.jobs
WHERE id = '1c84f01a-c28a-4e55-80d5-4f8c4ea2ae82';

-- 2. Corrigir a vaga: voltar para aprovação pendente
-- Se flow_status = 'ativa' mas approval_status não está 'active', 
-- significa que foi descongelada e precisa voltar para aprovação
UPDATE public.jobs
SET 
    approval_status = 'pending_approval',
    status = 'draft',
    flow_status = 'ativa',
    updated_at = NOW()
WHERE id = '1c84f01a-c28a-4e55-80d5-4f8c4ea2ae82'
    AND flow_status = 'ativa'
    AND approval_status != 'active';

-- 3. Verificar se a correção foi aplicada
SELECT 
    id,
    title,
    department,
    city,
    state,
    status,
    approval_status,
    flow_status,
    updated_at
FROM public.jobs
WHERE id = '1c84f01a-c28a-4e55-80d5-4f8c4ea2ae82';

-- NOTA: Após executar este script, a vaga deve aparecer na fila de aprovação
-- para admin/gerente revisar e aprovar novamente.

