import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceKey) {
            console.error('Secrets não carregados: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY estão faltando.');
            return new Response(JSON.stringify({ error: 'Configuração do servidor incompleta: secrets faltando.' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const { userId, newPassword } = await req.json();

        if (!userId || !newPassword) {
            console.error('Parâmetros faltando na requisição:', { userId: !!userId, newPassword: !!newPassword });
            return new Response(JSON.stringify({ error: 'ID do usuário e nova senha são obrigatórios' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey);

        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (error) {
            console.error('Erro da API do Supabase ao atualizar usuário:', error);
            return new Response(JSON.stringify({ error: `Erro do Supabase: ${error.message}` }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ success: true, email: data.user.email }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Erro inesperado no bloco try-catch:', error);
        return new Response(JSON.stringify({ error: `Erro inesperado no servidor: ${error.message}` }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}) 