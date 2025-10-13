-- ========================================
-- VERIFICAÇÃO: Candidatos no Banco de Talentos
-- ========================================

-- 1. TOTAL DE CANDIDATOS NO BANCO DE TALENTOS
SELECT 
    COUNT(*) as candidatos_banco_talentos,
    'BANCO DE TALENTOS' as descricao
FROM public.candidates c
JOIN public.jobs j ON c.job_id = j.id
WHERE j.title = 'Banco de Talentos';

-- 2. TOTAL DE CANDIDATOS EM OUTRAS VAGAS
SELECT 
    COUNT(*) as candidatos_outras_vagas,
    'OUTRAS VAGAS' as descricao
FROM public.candidates c
JOIN public.jobs j ON c.job_id = j.id
WHERE j.title != 'Banco de Talentos';

-- 3. TOTAL GERAL (para conferir)
SELECT 
    COUNT(*) as total_geral,
    'TOTAL GERAL' as descricao
FROM public.candidates;

-- 4. VERIFICAR SE A SOMA BATE
SELECT 
    (SELECT COUNT(*) FROM public.candidates c JOIN public.jobs j ON c.job_id = j.id WHERE j.title = 'Banco de Talentos') +
    (SELECT COUNT(*) FROM public.candidates c JOIN public.jobs j ON c.job_id = j.id WHERE j.title != 'Banco de Talentos') as soma_verificacao;

-- 5. CANDIDATOS SEM VAGA (job_id NULL)
SELECT 
    COUNT(*) as candidatos_sem_vaga,
    'SEM VAGA (job_id NULL)' as descricao
FROM public.candidates
WHERE job_id IS NULL;

-- 6. DISTRIBUIÇÃO POR TIPO DE VAGA
SELECT 
    CASE 
        WHEN j.title = 'Banco de Talentos' THEN 'Banco de Talentos'
        WHEN j.title IS NULL THEN 'Sem Vaga'
        ELSE 'Outras Vagas'
    END as tipo_vaga,
    COUNT(*) as quantidade
FROM public.candidates c
LEFT JOIN public.jobs j ON c.job_id = j.id
GROUP BY 
    CASE 
        WHEN j.title = 'Banco de Talentos' THEN 'Banco de Talentos'
        WHEN j.title IS NULL THEN 'Sem Vaga'
        ELSE 'Outras Vagas'
    END
ORDER BY quantidade DESC;

