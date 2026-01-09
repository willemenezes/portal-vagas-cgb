import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

// Configurações CORS - aceitar múltiplas origens
const getCorsHeaders = (origin: string | null) => {
  const allowedOrigins = [
    'https://vagas.grupocgb.com.br',
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000',
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
  ];

  const isAllowed = origin && allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') return origin === allowed;
    if (allowed instanceof RegExp) return allowed.test(origin);
    return false;
  });

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://vagas.grupocgb.com.br',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
};

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
    
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);

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

    // Verificar se as variáveis de ambiente estão configuradas
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
        console.error("❌ Variáveis de ambiente SMTP não configuradas");
        return new Response(JSON.stringify({
            error: 'Configuração SMTP incompleta. Verifique as variáveis de ambiente.',
            hint: 'Configure SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASSWORD no Supabase Dashboard'
        }), {
            status: 500,
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
        const port = parseInt(SMTP_PORT, 10);
        const useTLS = port === 587 || port === 465;
        
        // 🔥 Adicionar retry logic com timeout
        let retries = 3;
        let connected = false;
        let lastError;
        
        while (retries > 0 && !connected) {
            try {
                console.log(`🔄 Tentativa de conexão SMTP (${4 - retries}/3)...`);
                
                const connectTimeout = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout de conexão SMTP (30s)')), 30000)
                );
                
                const connectPromise = useTLS
                    ? client.connectTLS({
                        hostname: SMTP_HOST,
                        port: port,
                        username: SMTP_USER,
                        password: SMTP_PASSWORD,
                      })
                    : client.connect({
                        hostname: SMTP_HOST,
                        port: port,
                        username: SMTP_USER,
                        password: SMTP_PASSWORD,
                      });
                
                await Promise.race([connectPromise, connectTimeout]);
                connected = true;
                console.log("✅ Conectado ao servidor SMTP");
            } catch (error: any) {
                lastError = error;
                retries--;
                console.error(`❌ Erro na tentativa de conexão: ${error.message}`);
                
                if (retries > 0) {
                    console.log(`⏳ Aguardando 2s antes de tentar novamente...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
        
        if (!connected) {
            throw new Error(`Falha ao conectar ao SMTP após 3 tentativas: ${lastError?.message}`);
        }

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
            errorDetails = 'Verifique se o usuário e senha estão corretos. Para Gmail, use senha de app.';
        } else if (error.message?.includes('timeout') || error.message?.includes('ECONNREFUSED')) {
            errorMessage = 'Não foi possível conectar ao servidor SMTP';
            errorDetails = 'Verifique SMTP_HOST e SMTP_PORT. Verifique também firewall/rede.';
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
