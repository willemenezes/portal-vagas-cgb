-- Script para conectar candidatos existentes com currículos do banco de talentos
-- Executar em: https://supabase.com/dashboard/project/csgmamxhqkqdknohfsfj/sql

-- Atualizar candidatos que têm currículo no banco de talentos (tabela resumes) mas não têm resume_file_url
UPDATE public.candidates 
SET 
    resume_file_url = r.resume_file_url,
    resume_file_name = r.resume_file_name
FROM public.resumes r
WHERE candidates.email = r.email 
AND candidates.resume_file_url IS NULL 
AND r.resume_file_url IS NOT NULL;

-- Verificar quantos candidatos foram atualizados
SELECT 
    COUNT(*) as candidatos_atualizados,
    'Candidatos com currículo do banco de talentos conectado' as descricao
FROM public.candidates c
INNER JOIN public.resumes r ON c.email = r.email
WHERE c.resume_file_url IS NOT NULL;

-- Mostrar candidatos que ainda não têm currículo
SELECT 
    c.id,
    c.name,
    c.email,
    c.resume_file_url,
    'Sem currículo' as status
FROM public.candidates c
WHERE c.resume_file_url IS NULL
ORDER BY c.created_at DESC;
