-- SCRIPT FINAL: Adicionar RH Admin sem ON CONFLICT

-- 1. Verificar se o usuário já existe
SELECT 
    'Verificando usuario existente:' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM rh_users WHERE user_id = auth.uid()) 
        THEN 'JA EXISTE'
        ELSE 'NAO EXISTE - PRECISA INSERIR'
    END as status;

-- 2. Inserir apenas se não existir (sem ON CONFLICT)
DO $$
BEGIN
    -- Verificar se já existe
    IF NOT EXISTS (SELECT 1 FROM rh_users WHERE user_id = auth.uid()) THEN
        -- Inserir novo usuário RH Admin
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
        );
        RAISE NOTICE 'Usuario RH Admin inserido com sucesso!';
    ELSE
        -- Atualizar usuário existente
        UPDATE rh_users 
        SET 
            role = 'admin',
            is_admin = true,
            updated_at = NOW()
        WHERE user_id = auth.uid();
        RAISE NOTICE 'Usuario RH Admin atualizado com sucesso!';
    END IF;
END $$;

-- 3. Verificar resultado final
SELECT 
    'Usuario RH cadastrado:' as info,
    user_id,
    email,
    role,
    is_admin,
    created_at
FROM rh_users 
WHERE user_id = auth.uid();

-- 4. Teste final de permissão
SELECT 
    'TESTE FINAL:' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM rh_users
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'recruiter', 'manager')
        ) THEN '🎉 PERMISSAO CONCEDIDA - PODE INSERIR DADOS JURIDICOS!'
        ELSE '❌ ERRO - AINDA SEM PERMISSAO'
    END as resultado_final;

SELECT '✅ Configuração completa! Teste a inserção de dados jurídicos agora.' as status;
