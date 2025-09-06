import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

// Configurações de CORS
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Configurações SMTP
const SMTP_HOST = "mail.cgbengenharia.com.br";
const SMTP_PORT = 587;
const SMTP_USER = "ti.belem@cgbengenharia.com.br";
const SMTP_PASSWORD = "H6578m2024@cgb|";

// Templates de email
const EMAIL_TEMPLATES = {
    new_job_request: {
        subject: '🆕 Nova Solicitação de Vaga - {{jobTitle}}',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: linear-gradient(135deg, #6a0b27, #8b1538); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🆕 Nova Solicitação de Vaga</h1>
        </header>
        <main style="padding: 30px 20px; background: white;">
          <p>Olá <strong>{{recipientName}}</strong>,</p>
          
          <p>Uma nova solicitação de vaga foi criada e precisa da sua aprovação:</p>
          
          <div style="background: #f8f9fa; border-left: 4px solid #6a0b27; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #6a0b27;">📋 Detalhes da Vaga</h3>
            <p><strong>Título:</strong> {{jobTitle}}</p>
            <p><strong>Departamento:</strong> {{department}}</p>
            <p><strong>Localização:</strong> {{city}}, {{state}}</p>
            <p><strong>Solicitado por:</strong> {{senderName}}</p>
          </div>
          
          <p>Acesse o portal para revisar e aprovar a solicitação.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://cgbvagas.com.br/admin" style="background: #6a0b27; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              🔍 Revisar Solicitação
            </a>
          </div>
        </main>
        <footer style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
          <p style="margin: 0;">Portal CGB Vagas - Sistema Automatizado</p>
        </footer>
      </div>
    `
    },

    job_request_approved: {
        subject: '✅ Solicitação de Vaga Aprovada - {{jobTitle}}',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: linear-gradient(135deg, #28a745, #34ce57); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">✅ Solicitação Aprovada</h1>
        </header>
        <main style="padding: 30px 20px; background: white;">
          <p>Olá <strong>{{recipientName}}</strong>,</p>
          
          <p>Sua solicitação de vaga foi aprovada e já está disponível para candidaturas!</p>
          
          <div style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #28a745;">📋 Vaga Aprovada</h3>
            <p><strong>Título:</strong> {{jobTitle}}</p>
            <p><strong>Departamento:</strong> {{department}}</p>
            <p><strong>Localização:</strong> {{city}}, {{state}}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://cgbvagas.com.br" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              🔍 Ver Vaga Publicada
            </a>
          </div>
        </main>
        <footer style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
          <p style="margin: 0;">Portal CGB Vagas - Sistema Automatizado</p>
        </footer>
      </div>
    `
    },

    job_request_rejected: {
        subject: '❌ Solicitação de Vaga Rejeitada - {{jobTitle}}',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: linear-gradient(135deg, #dc3545, #e74c3c); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">❌ Solicitação Rejeitada</h1>
        </header>
        <main style="padding: 30px 20px; background: white;">
          <p>Olá <strong>{{recipientName}}</strong>,</p>
          
          <p>Sua solicitação de vaga foi rejeitada pela gerência.</p>
          
          <div style="background: #f8f9fa; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #dc3545;">📋 Solicitação Rejeitada</h3>
            <p><strong>Título:</strong> {{jobTitle}}</p>
            <p><strong>Departamento:</strong> {{department}}</p>
            <p><strong>Localização:</strong> {{city}}, {{state}}</p>
            <p><strong>Motivo:</strong> {{rejectionReason}}</p>
          </div>
        </main>
        <footer style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
          <p style="margin: 0;">Portal CGB Vagas - Sistema Automatizado</p>
        </footer>
      </div>
    `
    }
};

function processTemplate(template: string, data: any): string {
    let processed = template;

    // Substituir placeholders no formato {{key}}
    Object.keys(data).forEach(key => {
        const placeholder = `{{${key}}}`;
        const value = data[key] || '';
        processed = processed.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return processed;
}

serve(async (req) => {
    console.log(`📨 Notification request: ${req.method} ${req.url}`);

    // Tratar CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Método não permitido' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const { type, recipients, data } = await req.json();

        if (!type || !recipients || !Array.isArray(recipients)) {
            return new Response(JSON.stringify({ error: 'Parâmetros inválidos' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const template = EMAIL_TEMPLATES[type as keyof typeof EMAIL_TEMPLATES];
        if (!template) {
            return new Response(JSON.stringify({ error: `Template não encontrado: ${type}` }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const results = [];

        // Enviar email para cada destinatário
        for (const recipient of recipients) {
            try {
                // Preparar dados do template incluindo dados do destinatário
                const templateData = {
                    ...data,
                    recipientName: recipient.name,
                    recipientEmail: recipient.email,
                    isRH: recipient.role === 'admin' || recipient.role === 'recruiter',
                    isManager: recipient.role === 'manager',
                    isCoordinator: recipient.role === 'solicitador',
                    isJuridico: recipient.role === 'juridico'
                };

                const subject = processTemplate(template.subject, templateData);
                const html = processTemplate(template.html, templateData);

                // Enviar email diretamente via SMTP
                const client = new SmtpClient();

                await client.connectTLS({
                    hostname: SMTP_HOST,
                    port: SMTP_PORT,
                    username: SMTP_USER,
                    password: SMTP_PASSWORD,
                });

                await client.send({
                    from: `"Portal CGB Vagas" <${SMTP_USER}>`,
                    to: recipient.email,
                    subject,
                    content: "Esta é uma mensagem em texto plano.",
                    html,
                });

                await client.close();

                console.log(`✅ Email enviado para ${recipient.email}`);
                results.push({ recipient: recipient.email, status: 'success' });

            } catch (error) {
                console.error(`Erro ao processar email para ${recipient.email}:`, error);
                results.push({ recipient: recipient.email, status: 'error', error: error.message });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            results,
            totalSent: results.filter(r => r.status === 'success').length,
            totalFailed: results.filter(r => r.status === 'error').length
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Erro na função send-notification:', error);
        return new Response(JSON.stringify({
            error: 'Erro interno',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

