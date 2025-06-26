import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { email, fullName, password, isAdmin, assignedStates, assignedCities } = await req.json()

        if (!email || !fullName || !password) {
            return new Response(JSON.stringify({ error: 'Faltando parâmetros obrigatórios' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: existingRhUser, error: rhCheckError } = await supabaseAdmin
            .from('rh_users')
            .select('id, user_id, email')
            .eq('email', email)
            .maybeSingle()

        if (existingRhUser) {
            return new Response(JSON.stringify({ error: 'Usuário já existe na equipe de RH' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        let authUserId: string | null = null
        let existingAuthUser = false

        try {
            const { data: allUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()

            if (listError) {
                throw listError
            }

            const foundUser = allUsers.users.find(user => user.email === email)

            if (foundUser) {
                authUserId = foundUser.id
                existingAuthUser = true
            } else {
            }
        } catch (error) {
            return new Response(JSON.stringify({ error: `Falha ao verificar usuários: ${error.message}` }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        if (!existingAuthUser) {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true,
                user_metadata: {
                    full_name: fullName
                }
            })

            if (authError) {
                return new Response(JSON.stringify({ error: `Falha ao criar usuário no Auth: ${authError.message}` }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            if (!authData.user) {
                return new Response(JSON.stringify({ error: 'Nenhum usuário retornado pelo Auth' }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            authUserId = authData.user.id
        }

        const insertData = {
            user_id: authUserId,
            email: email,
            full_name: fullName,
            is_admin: isAdmin || false,
            assigned_states: isAdmin ? null : assignedStates,
            assigned_cities: isAdmin ? null : assignedCities,
        }

        const { data: rhUser, error: rhInsertError } = await supabaseAdmin
            .from('rh_users')
            .insert(insertData)
            .select()
            .single()

        if (rhInsertError) {
            if (!existingAuthUser && authUserId) {
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
            credentials: { email, password, fullName },
            wasExistingUser: existingAuthUser
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