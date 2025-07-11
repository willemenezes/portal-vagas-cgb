-- Script para corrigir aprovadores existentes que estão como ID em vez de nome
-- Atualiza todos os registros onde approved_by é um UUID para o nome real do usuário

UPDATE public.job_requests 
SET approved_by = COALESCE(rh_users.full_name, auth_users.email, 'Aprovador Desconhecido')
FROM public.rh_users
LEFT JOIN auth.users AS auth_users ON auth_users.id = rh_users.user_id::uuid
WHERE job_requests.approved_by IS NOT NULL 
  AND LENGTH(job_requests.approved_by) = 36  -- UUID tem 36 caracteres
  AND job_requests.approved_by ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'  -- Regex para UUID
  AND rh_users.user_id = job_requests.approved_by;

-- Verificar se a atualização funcionou
SELECT 
    id,
    title,
    approved_by,
    approved_at,
    status
FROM public.job_requests 
WHERE approved_by IS NOT NULL
ORDER BY approved_at DESC; 