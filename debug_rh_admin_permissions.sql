-- DEBUG: Verificar permissões do RH Admin para candidate_legal_data

-- 1. Verificar se o usuário atual existe na tabela rh_users
SELECT 
    'Usuario atual:' as info,
    auth.uid() as user_id,
    auth.email() as user_email;

-- 2. Verificar todos os usuários RH cadastrados
SELECT 
    'Usuarios RH cadastrados:' as info,
    rh.user_id,
    rh.name,
    rh.email,
    rh.role,
    rh.is_admin
FROM rh_users rh
ORDER BY rh.created_at DESC;

-- 3. Verificar se o usuário atual tem permissão de RH
SELECT 
    'Permissao do usuario atual:' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM rh_users
            WHERE rh_users.user_id = auth.uid()
            AND rh_users.role IN ('admin', 'recruiter', 'manager')
        ) THEN 'TEM PERMISSAO'
        ELSE 'NAO TEM PERMISSAO'
    END as status;

-- 4. Verificar políticas RLS ativas na tabela candidate_legal_data
SELECT 
    'Politicas RLS ativas:' as info,
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'candidate_legal_data'
ORDER BY policyname;

-- 5. Verificar se RLS está habilitado
SELECT 
    'Status RLS:' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'candidate_legal_data';

-- 6. Teste de inserção (simular)
SELECT 
    'Teste de permissao INSERT:' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM rh_users
            WHERE rh_users.user_id = auth.uid()
            AND rh_users.role IN ('admin', 'recruiter', 'manager')
        ) THEN 'PODE INSERIR'
        ELSE 'NAO PODE INSERIR - Usuario nao encontrado em rh_users'
    END as resultado;
