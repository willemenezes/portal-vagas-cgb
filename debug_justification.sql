-- Verificar se a coluna justification existe na tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'job_requests' AND column_name = 'justification';

-- Verificar dados das solicitações existentes
SELECT id, title, justification, created_at 
FROM public.job_requests 
ORDER BY created_at DESC 
LIMIT 10; 