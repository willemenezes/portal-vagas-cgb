-- SCRIPT CORRIGIDO: Adicionar usuário RH Admin com nomes corretos das colunas

-- 1. Primeiro, verificar a estrutura real da tabela rh_users
SELECT 
    'Estrutura da tabela rh_users:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'rh_users'
ORDER BY ordinal_position;

-- 2. Verificar dados do usuário atual
SELECT 
    'Usuario atual:' as info,
    auth.uid() as user_id,
    auth.email() as user_email;

-- 3. Inserir o usuário atual como RH Admin (apenas com colunas que existem)
INSERT INTO rh_users (
    user_id,
    email,
    role,
    is_admin
) VALUES (
    auth.uid(),
    auth.email(),
    'admin',
    true
) 
ON CONFLICT (user_id) DO UPDATE SET
    role = 'admin',
    is_admin = true,
    updated_at = NOW();

-- 4. Verificar se foi inserido corretamente
SELECT 
    'Usuario RH cadastrado:' as info,
    user_id,
    email,
    role,
    is_admin,
    created_at
FROM rh_users 
WHERE user_id = auth.uid();

-- 5. Testar permissão final
SELECT 
    'Teste de permissao:' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM rh_users
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'recruiter', 'manager')
        ) THEN '✅ TEM PERMISSAO PARA DADOS JURIDICOS!'
        ELSE '❌ AINDA SEM PERMISSAO'
    END as resultado;

SELECT '🎉 RH Admin cadastrado com sucesso!' as status;
