-- DEBUG CORRIGIDO: Verificar estrutura e dados da tabela rh_users

-- 1. Verificar estrutura da tabela rh_users
SELECT 
    'Estrutura da tabela rh_users:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'rh_users'
ORDER BY ordinal_position;

-- 2. Verificar usuário atual
SELECT 
    'Usuario atual logado:' as info,
    auth.uid() as user_id,
    auth.email() as user_email;

-- 3. Verificar todos os usuários RH (usando nomes corretos das colunas)
SELECT 
    'Usuarios RH cadastrados:' as info,
    user_id,
    email,
    role,
    is_admin,
    created_at
FROM rh_users
ORDER BY created_at DESC;

-- 4. Verificar se usuário atual está na tabela rh_users
SELECT 
    'Usuario atual na tabela rh_users:' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM rh_users
            WHERE user_id = auth.uid()
        ) THEN 'ENCONTRADO'
        ELSE 'NAO ENCONTRADO'
    END as status,
    (SELECT role FROM rh_users WHERE user_id = auth.uid()) as role_usuario;

-- 5. Verificar permissão específica para inserir dados jurídicos
SELECT 
    'Permissao para dados juridicos:' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM rh_users
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'recruiter', 'manager')
        ) THEN 'TEM PERMISSAO'
        ELSE 'SEM PERMISSAO'
    END as resultado;
