# 🔧 CORREÇÃO: Erro ao Criar Usuário Jurídico

## ❌ PROBLEMA
Ao tentar criar um usuário com role "Jurídico", aparece erro: **"Edge Function returned a non-2xx status code"**

## ✅ SOLUÇÃO
Execute o script SQL abaixo no Supabase Dashboard para corrigir a função.

---

## 📋 COMO EXECUTAR

### 1️⃣ Acesse o Supabase
- Abra: https://supabase.com/dashboard/project/csgmamxhqkqdknohfsfj
- Vá em **"SQL Editor"** (menu lateral)

### 2️⃣ Execute o Script
Copie e cole o código abaixo e clique em **"Run"**:

```sql
-- CORREÇÃO: Incluir 'juridico' nos roles com acesso regional
DROP FUNCTION IF EXISTS public.create_user_direct(text, text, text, text, text[], text[]);

CREATE OR REPLACE FUNCTION public.create_user_direct(
    email text,
    full_name text,
    password text,
    role text,
    assigned_states text[] DEFAULT NULL,
    assigned_cities text[] DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    auth_user_id uuid;
    has_regional_access boolean;
    result_user jsonb;
BEGIN
    -- Validar parâmetros
    IF email IS NULL OR full_name IS NULL OR password IS NULL OR role IS NULL THEN
        RETURN json_build_object('error', 'Faltando parâmetros obrigatórios');
    END IF;

    -- Verificar se email já existe
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = email) THEN
        RETURN json_build_object('error', 'E-mail já cadastrado');
    END IF;

    -- ✅ CORREÇÃO: Incluir 'juridico' nos roles com acesso regional
    has_regional_access := role IN ('recruiter', 'manager', 'solicitador', 'juridico');

    -- Criar usuário no auth
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        email,
        crypt(password, gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        json_build_object('full_name', full_name),
        now(),
        now()
    ) RETURNING id INTO auth_user_id;

    -- Inserir na tabela rh_users
    INSERT INTO public.rh_users (
        user_id, email, full_name, role, is_admin,
        assigned_states, assigned_cities
    ) VALUES (
        auth_user_id, email, full_name, role, role = 'admin',
        CASE WHEN has_regional_access THEN assigned_states ELSE NULL END,
        CASE WHEN has_regional_access THEN assigned_cities ELSE NULL END
    ) RETURNING to_jsonb(*) INTO result_user;

    -- Retornar sucesso
    RETURN json_build_object(
        'success', true,
        'user', result_user,
        'generatedPassword', password
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Limpar se der erro
        IF auth_user_id IS NOT NULL THEN
            DELETE FROM auth.users WHERE id = auth_user_id;
        END IF;
        RETURN json_build_object('error', 'Erro: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.create_user_direct(text, text, text, text, text[], text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_direct(text, text, text, text, text[], text[]) TO service_role;
```

### 3️⃣ Aguarde o Sucesso
- Deve aparecer: **"Sucesso. Nenhuma linha retornada"**

### 4️⃣ Teste
- Volte para o painel admin
- Tente criar um usuário com role "Jurídico"
- Deve funcionar sem erros! ✅

---

## 🎯 O QUE FOI CORRIGIDO

**ANTES:** A função não incluía o role `'juridico'` nos roles com acesso regional

**DEPOIS:** Agora inclui: `'recruiter', 'manager', 'solicitador', 'juridico'`

---

## ✅ RESULTADO ESPERADO

Após executar o script:
- ✅ Usuários jurídicos são criados normalmente
- ✅ Não aparece mais erro 400
- ✅ Campos regionais são preenchidos corretamente
- ✅ Sistema funciona perfeitamente

---

**🚀 Execute o script e me avise se funcionou!**
