import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para validar senha
function validatePassword(password: string): { valid: boolean; message?: string } {
    if (!password) {
        return { valid: false, message: 'A senha não pode estar em branco.' };
    }
    if (password.length < 8) {
        return { valid: false, message: 'A senha deve ter pelo menos 8 caracteres.' };
    }
    if (!/(?=.*[a-z])/.test(password)) {
        return { valid: false, message: 'A senha deve conter pelo menos uma letra minúscula.' };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
        return { valid: false, message: 'A senha deve conter pelo menos uma letra maiúscula.' };
    }
    if (!/(?=.*\d)/.test(password)) {
        return { valid: false, message: 'A senha deve conter pelo menos um número.' };
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
        return { valid: false, message: 'A senha deve conter pelo menos um caractere especial (@$!%*?&).' };
    }
    return { valid: true };
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { email, fullName, password, role, assignedStates, assignedCities, assignedDepartments } = await req.json()

        if (!email || !fullName || !password || !role) {
            return new Response(JSON.stringify({ error: 'Faltando parâmetros obrigatórios (email, fullName, password, role)' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Validar senha
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return new Response(JSON.stringify({ error: passwordValidation.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Verifica se o usuário já existe na tabela de autenticação do Supabase
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        const foundUser = users.find(user => user.email === email);
        if (foundUser) {
            return new Response(JSON.stringify({ error: 'Este e-mail já está cadastrado no sistema de autenticação.' }), {
                status: 409, // 409 Conflict
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Se o email não existe, prossegue com a criação
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Confirma o email automaticamente
            user_metadata: {
                full_name: fullName
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Criação de usuário no Auth não retornou um usuário.");

        const authUserId = authData.user.id;

        const hasRegionalAccess = role === 'recruiter' || role === 'manager' || role === 'solicitador' || role === 'juridico';

        const insertData = {
            user_id: authUserId,
            email: email,
            full_name: fullName,
            role: role,
            is_admin: role === 'admin',
            assigned_states: hasRegionalAccess ? assignedStates : null,
            assigned_cities: hasRegionalAccess ? assignedCities : null,
            assigned_departments: role === 'manager' ? assignedDepartments : null,
        }

        const { data: rhUser, error: rhInsertError } = await supabaseAdmin
            .from('rh_users')
            .insert(insertData)
            .select()
            .single()

        if (rhInsertError) {
            if (authUserId) {
                await supabaseAdmin.auth.admin.deleteUser(authUserId)
            }

            return new Response(JSON.stringify({ error: `Falha ao criar perfil RH: ${rhInsertError.message}` }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        return new Response(JSON.stringify({
            success: true,
            user: rhUser,
            generatedPassword: password,
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: `Erro interno do servidor: ${error.message}` }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
}) 