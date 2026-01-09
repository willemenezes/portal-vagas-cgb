import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

// Configurações CORS específicas para o domínio
const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://vagas.grupocgb.com.br',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
};

// ⚠️ DADOS SMTP CGB ENGENHARIA - CONFIGURADOS
// Se as variáveis de ambiente não estiverem configuradas, usa estes valores padrão
const SMTP_HOST = Deno.env.get("SMTP_HOST") || "mail.cgbengenharia.com.br";
const SMTP_PORT = Deno.env.get("SMTP_PORT") || "587";
const SMTP_USER = Deno.env.get("SMTP_USER") || "ti.belem@cgbengenharia.com.br";
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "H6578m2024@cgb";

console.log("📧 Configurações SMTP:", {
    host: SMTP_HOST,
    port: SMTP_PORT,
    user: SMTP_USER ? "✅ Configurado" : "❌ Não configurado",
    password: SMTP_PASSWORD ? "✅ Configurado" : "❌ Não configurado"
});

serve(async (req) => {
    console.log(`📨 Requisição recebida: ${req.method} ${req.url}`);

    // Tratar requisição pre-flight do CORS
    if (req.method === 'OPTIONS') {
        console.log("✅ Respondendo a requisição OPTIONS (CORS)");
        return new Response(null, {
            status: 200,
            headers: corsHeaders
        });
    }

    // Verificar se é uma requisição POST
    if (req.method !== 'POST') {
        console.log(`❌ Método não permitido: ${req.method}`);
        return new Response(JSON.stringify({ error: `Método ${req.method} não permitido. Use POST.` }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const body = await req.json();
        const { to, subject, html, fromName, fromEmail, cc, bcc } = body;

        // Validação de parâmetros obrigatórios
        if (!to || !subject || !html) {
            console.log("❌ Parâmetros obrigatórios ausentes");
            return new Response(JSON.stringify({
                error: 'Parâmetros obrigatórios ausentes.',
                required: ['to', 'subject', 'html'],
                received: {
                    to: !!to,
                    subject: !!subject,
                    html: !!html
                }
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
            console.log(`❌ Email inválido: ${to}`);
            return new Response(JSON.stringify({
                error: 'Formato de email inválido',
                email: to
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log(`📧 Tentando enviar email para: ${to}`);
        console.log(`📧 Assunto: ${subject}`);

        const client = new SmtpClient();

        // Conectar ao servidor SMTP
        // Porta 587 geralmente usa STARTTLS, porta 25 pode ser sem criptografia
        const port = parseInt(SMTP_PORT, 10);
        const useTLS = port === 587 || port === 465;
        
        if (useTLS) {
            // Porta 587 (STARTTLS) ou 465 (SSL/TLS)
            console.log(`🔐 Conectando com TLS na porta ${port}...`);
            await client.connectTLS({
                hostname: SMTP_HOST,
                port: port,
                username: SMTP_USER,
                password: SMTP_PASSWORD,
            });
        } else {
            // Porta 25 ou outras sem criptografia
            console.log(`🔓 Conectando sem TLS na porta ${port}...`);
            await client.connect({
                hostname: SMTP_HOST,
                port: port,
                username: SMTP_USER,
                password: SMTP_PASSWORD,
            });
        }

        console.log("✅ Conectado ao servidor SMTP");

        // Preparar opções de envio
        const sendOptions: any = {
            from: `"${fromName || 'CGB Energia RH'}" <${fromEmail || 'naoresponda@cgbenergia.com.br'}>`,
            to,
            subject,
            content: html.replace(/<[^>]*>/g, ''), // Versão texto plano extraída do HTML
            html,
        };

        // Adicionar CC e BCC se fornecidos
        if (cc) sendOptions.cc = cc;
        if (bcc) sendOptions.bcc = bcc;

        // Enviar email
        await client.send(sendOptions);

        // Fechar conexão
        await client.close();

        console.log(`✅ Email enviado com sucesso para: ${to}`);
        
        return new Response(JSON.stringify({ 
            success: true,
            message: 'E-mail enviado com sucesso!',
            to,
            subject
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('❌ Erro ao enviar e-mail:', error);
        console.error('Stack trace:', error.stack);

        // Mensagens de erro mais amigáveis
        let errorMessage = 'Erro ao enviar email';
        let errorDetails = error.message;

        if (error.message?.includes('535')) {
            errorMessage = 'Falha na autenticação SMTP';
            errorDetails = 'Verifique se o usuário e senha estão corretos.';
        } else if (error.message?.includes('timeout') || error.message?.includes('ECONNREFUSED')) {
            errorMessage = 'Não foi possível conectar ao servidor SMTP';
            errorDetails = `Verifique se ${SMTP_HOST}:${SMTP_PORT} está acessível. Verifique também firewall/rede.`;
        } else if (error.message?.includes('550') || error.message?.includes('553')) {
            errorMessage = 'Email rejeitado pelo servidor';
            errorDetails = 'Verifique se o endereço de email está correto e se o domínio está autorizado.';
        }

        return new Response(JSON.stringify({
            success: false,
            error: errorMessage,
            details: errorDetails,
            stack: Deno.env.get('DENO_ENV') === 'development' ? error.stack : undefined
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
