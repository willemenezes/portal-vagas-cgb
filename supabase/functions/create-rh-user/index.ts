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
        // Verificar se é uma requisição POST
        if (req.method !== 'POST') {
            return new Response(
                JSON.stringify({ error: 'Method not allowed' }),
                {
                    status: 405,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Parse do body da requisição
        const { email, fullName, password, isAdmin, assignedStates, assignedCities, adminUserId } = await req.json()

        if (!email || !fullName || !password || !adminUserId) {
            return new Response(
                JSON.stringify({ error: 'Missing required parameters' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Criar cliente Supabase com privilégios de admin
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Verificar se o usuário que está fazendo a requisição é admin
        const { data: adminUser, error: adminError } = await supabaseAdmin
            .from('rh_users')
            .select('is_admin')
            .eq('user_id', adminUserId)
            .single()

        if (adminError || !adminUser || !adminUser.is_admin) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Only admins can create users' }),
                {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Verificar se o email já existe na tabela rh_users
        const { data: existingRHUser, error: existingRHError } = await supabaseAdmin
            .from('rh_users')
            .select('email')
            .eq('email', email)
            .single()

        if (existingRHUser) {
            return new Response(
                JSON.stringify({ error: 'Este e-mail já está cadastrado no sistema' }),
                {
                    status: 409,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // 1. Primeiro, criar o usuário no sistema de autenticação
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Confirmar email automaticamente
            user_metadata: {
                full_name: fullName
            }
        })

        if (authError) {
            console.error('Error creating auth user:', authError)
            return new Response(
                JSON.stringify({ error: 'Failed to create authentication user: ' + authError.message }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        if (!authUser.user) {
            return new Response(
                JSON.stringify({ error: 'Failed to create authentication user' }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // 2. Depois, criar o registro na tabela rh_users com o user_id correto
        const { data: rhUser, error: rhError } = await supabaseAdmin
            .from('rh_users')
            .insert({
                user_id: authUser.user.id,
                email: email,
                full_name: fullName,
                is_admin: isAdmin || false,
                assigned_states: isAdmin ? null : assignedStates,
                assigned_cities: isAdmin ? null : assignedCities,
            })
            .select()
            .single()

        if (rhError) {
            console.error('Error creating RH user:', rhError)

            // Se falhou ao criar na tabela rh_users, remover o usuário de auth
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)

            return new Response(
                JSON.stringify({ error: 'Failed to create RH user: ' + rhError.message }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Retornar sucesso
        return new Response(
            JSON.stringify({
                success: true,
                message: 'User created successfully',
                user: {
                    id: rhUser.id,
                    email: rhUser.email,
                    full_name: rhUser.full_name,
                    is_admin: rhUser.is_admin,
                    auth_id: authUser.user.id
                },
                credentials: {
                    email: email,
                    password: password
                }
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        console.error('Unexpected error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error: ' + error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
}) 