-- Script para restaurar as vagas que sumiram após edição e rejeição
-- Vagas afetadas pela edição da Fernanda:
-- 1. "Assistente Adm - Cobrança" (Belém)
-- 2. "Atendente Presencial I" (Belém)
--
-- Execute este script no Supabase SQL Editor

-- 1. Verificar status atual das vagas ANTES de restaurar
SELECT 
    id,
    title,
    department,
    city,
    state,
    status,
    approval_status,
    flow_status,
    quantity,
    created_at,
    updated_at,
    deleted_at,
    rejection_reason,
    CASE 
        WHEN approval_status = 'rejected' AND status = 'draft' THEN '❌ REJEITADA - Precisa restaurar'
        WHEN approval_status = 'active' AND status = 'active' THEN '✅ ATIVA - Já está OK'
        WHEN approval_status = 'pending_approval' THEN '⚠️ PENDENTE - Aguardando aprovação'
        WHEN deleted_at IS NOT NULL THEN '🗑️ DELETADA - Não pode restaurar'
        ELSE '⚠️ Status: ' || approval_status || ' / ' || status
    END as situacao
FROM public.jobs
WHERE 
    deleted_at IS NULL
    AND (
        -- Buscar "Assistente Adm - Cobrança" em Belém
        (title ILIKE '%Assistente%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
        OR
        -- Buscar "Atendente Presencial I" em Belém
        (title ILIKE '%Atendente Presencial I%' AND city ILIKE '%Belém%')
        OR
        -- Buscar variações do título
        (title ILIKE '%Assistente Adm%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
        OR
        (title ILIKE '%Assistente Administrativo%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
    )
ORDER BY updated_at DESC;

-- 2. Contar quantas vagas serão restauradas
SELECT 
    COUNT(*) as total_vagas_para_restaurar
FROM public.jobs
WHERE 
    deleted_at IS NULL
    AND (
        (title ILIKE '%Assistente%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
        OR (title ILIKE '%Atendente Presencial I%' AND city ILIKE '%Belém%')
        OR (title ILIKE '%Assistente Adm%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
        OR (title ILIKE '%Assistente Administrativo%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
    )
    AND (
        approval_status = 'rejected'
        OR status = 'draft'
        OR (approval_status = 'pending_approval' AND status = 'draft')
    );

-- 3. RESTAURAR as vagas para o estado ativo
-- Isso cancela a rejeição da edição e restaura a vaga ao estado anterior
UPDATE public.jobs
SET 
    approval_status = 'active',
    status = 'active',
    flow_status = COALESCE(flow_status, 'ativa'), -- Manter flow_status atual ou definir como 'ativa'
    rejection_reason = NULL, -- Limpar motivo de rejeição
    updated_at = NOW()
WHERE 
    deleted_at IS NULL
    AND (
        (title ILIKE '%Assistente%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
        OR (title ILIKE '%Atendente Presencial I%' AND city ILIKE '%Belém%')
        OR (title ILIKE '%Assistente Adm%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
        OR (title ILIKE '%Assistente Administrativo%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
    )
    AND (
        approval_status = 'rejected'
        OR status = 'draft'
        OR (approval_status = 'pending_approval' AND status = 'draft')
    );

-- 4. Verificar resultado APÓS restauração
SELECT 
    id,
    title,
    department,
    city,
    state,
    status,
    approval_status,
    flow_status,
    quantity,
    updated_at,
    CASE 
        WHEN approval_status = 'active' AND status = 'active' THEN '✅ RESTAURADA - Ativa no site'
        WHEN approval_status = 'pending_approval' THEN '⚠️ Ainda pendente de aprovação'
        ELSE '⚠️ Ainda precisa verificação - Status: ' || approval_status || ' / ' || status
    END as resultado
FROM public.jobs
WHERE 
    deleted_at IS NULL
    AND (
        (title ILIKE '%Assistente%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
        OR (title ILIKE '%Atendente Presencial I%' AND city ILIKE '%Belém%')
        OR (title ILIKE '%Assistente Adm%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
        OR (title ILIKE '%Assistente Administrativo%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
    )
ORDER BY updated_at DESC;

-- 5. Confirmar quantas vagas foram restauradas com sucesso
SELECT 
    COUNT(*) as vagas_restauradas_com_sucesso
FROM public.jobs
WHERE 
    deleted_at IS NULL
    AND (
        (title ILIKE '%Assistente%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
        OR (title ILIKE '%Atendente Presencial I%' AND city ILIKE '%Belém%')
        OR (title ILIKE '%Assistente Adm%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
        OR (title ILIKE '%Assistente Administrativo%' AND title ILIKE '%Cobrança%' AND city ILIKE '%Belém%')
    )
    AND approval_status = 'active'
    AND status = 'active';

-- NOTA: Se as vagas não forem encontradas pelos títulos acima, você pode:
-- 1. Executar o script buscar_vagas_por_titulo.sql para encontrar os IDs exatos
-- 2. Usar o script restaurar_vaga_especifica_por_id.sql com os IDs encontrados



