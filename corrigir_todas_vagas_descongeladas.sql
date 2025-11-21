-- Script para corrigir TODAS as vagas que foram descongeladas mas não voltaram para aprovação
-- Este script identifica vagas que estão com flow_status = 'ativa' mas approval_status != 'active'
-- e que provavelmente foram descongeladas sem passar pelo fluxo de aprovação correto

-- 1. Verificar quantas vagas estão nessa situação
SELECT 
    COUNT(*) as total_vagas_com_problema,
    COUNT(*) FILTER (WHERE flow_status = 'ativa' AND approval_status != 'active' AND approval_status != 'pending_approval') as vagas_para_corrigir
FROM public.jobs
WHERE flow_status = 'ativa'
    AND approval_status != 'active'
    AND approval_status != 'pending_approval';

-- 2. Listar todas as vagas que precisam ser corrigidas
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
WHERE flow_status = 'ativa'
    AND approval_status != 'active'
    AND approval_status != 'pending_approval'
ORDER BY updated_at DESC;

-- 3. Corrigir TODAS as vagas que foram descongeladas mas não voltaram para aprovação
-- Isso garante que todas as vagas descongeladas passem pelo fluxo de aprovação correto
UPDATE public.jobs
SET 
    approval_status = 'pending_approval',
    status = 'draft',
    flow_status = 'ativa',
    updated_at = NOW()
WHERE flow_status = 'ativa'
    AND approval_status != 'active'
    AND approval_status != 'pending_approval';

-- 4. Verificar quantas vagas foram corrigidas
SELECT 
    COUNT(*) as vagas_corrigidas
FROM public.jobs
WHERE flow_status = 'ativa'
    AND approval_status = 'pending_approval'
    AND status = 'draft';

-- 5. Listar as vagas corrigidas (para confirmação)
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
WHERE flow_status = 'ativa'
    AND approval_status = 'pending_approval'
    AND status = 'draft'
ORDER BY updated_at DESC;

-- NOTA: 
-- Após executar este script, todas as vagas descongeladas que estavam "perdidas"
-- voltarão para a fila de aprovação para admin/gerente revisar e aprovar novamente.
-- 
-- IMPORTANTE: Execute primeiro as queries 1 e 2 para verificar quais vagas serão afetadas
-- antes de executar a query 3 (UPDATE) que faz a correção.

