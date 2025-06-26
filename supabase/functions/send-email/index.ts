import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Validar variáveis de ambiente
const SMTP_HOST = Deno.env.get("SMTP_HOST");
const SMTP_PORT = Deno.env.get("SMTP_PORT");
const SMTP_USER = Deno.env.get("SMTP_USER");
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");

console.log("📧 Configurações SMTP:", {
    host: SMTP_HOST ? "✅ Configurado" : "❌ Não configurado",
    port: SMTP_PORT ? "✅ Configurado" : "❌ Não configurado",
    user: SMTP_USER ? "✅ Configurado" : "❌ Não configurado",
    password: SMTP_PASSWORD ? "✅ Configurado" : "❌ Não configurado"
});

serve(async (req) => {
    console.log(`📨 Requisição recebida: ${req.method} ${req.url}`);

    // Tratar requisição pre-flight do CORS
    if (req.method === 'OPTIONS') {
        console.log("✅ Respondendo a requisição OPTIONS (CORS)");
        return new Response('ok', { headers: corsHeaders });
    }

    // Verificar se é uma requisição POST
    if (req.method !== 'POST') {
        console.log(`❌ Método não permitido: ${req.method}`);
        return new Response(JSON.stringify({ error: `Método ${req.method} não permitido. Use POST.` }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Verificar se as variáveis de ambiente estão configuradas
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
        console.error("❌ Variáveis de ambiente SMTP não configuradas");
        return new Response(JSON.stringify({
            error: 'Configuração SMTP incompleta. Verifique as variáveis de ambiente.'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const { to, subject, html, fromName, fromEmail } = await req.json();

        if (!to || !subject || !html) {
            console.log("❌ Parâmetros obrigatórios ausentes");
            return new Response(JSON.stringify({
                error: 'Parâmetros obrigatórios ausentes. Necessário: to, subject, html'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const client = new SmtpClient();

        await client.connectTLS({
            hostname: SMTP_HOST,
            port: parseInt(SMTP_PORT, 10),
            username: SMTP_USER,
            password: SMTP_PASSWORD,
        });

        await client.send({
            from: `"${fromName || 'CGB Energia'}" <${fromEmail || 'naoresponda@cgbenergia.com.br'}>`,
            to,
            subject,
            content: "Esta é uma mensagem em texto plano.", // Fallback
            html,
        });

        await client.close();

        return new Response(JSON.stringify({ message: 'E-mail enviado com sucesso!' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('❌ Erro ao enviar e-mail:', error);
        console.error('Stack trace:', error.stack);

        return new Response(JSON.stringify({
            error: `Erro interno: ${error.message}`,
            details: error.stack
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}); 