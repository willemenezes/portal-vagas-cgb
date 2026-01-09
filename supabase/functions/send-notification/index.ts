import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Configurações de CORS diretamente no código
// 🔥 CORREÇÃO: Aceitar também IPs locais e desenvolvimento
const getCorsHeaders = (origin: string | null) => {
  const allowedOrigins = [
    'https://vagas.grupocgb.com.br',
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000',
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // IPs da rede interna
    /^http:\/\/127\.0\.0\.1:\d+$/, // localhost alternativo
  ];

  const isAllowed = origin && allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') {
      return origin === allowed;
    }
    if (allowed instanceof RegExp) {
      return allowed.test(origin);
    }
    return false;
  });

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://vagas.grupocgb.com.br',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
};

// Templates de email para cada tipo de notificação
const EMAIL_TEMPLATES = {
  // Fluxo de vagas
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
            <a href="https://vagas.grupocgb.com.br/admin" style="background: #6a0b27; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
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
        <header style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">✅ Solicitação Aprovada</h1>
        </header>
        <main style="padding: 30px 20px; background: white;">
          <p>Olá <strong>{{recipientName}}</strong>,</p>
          
          <p>A solicitação de vaga foi aprovada pela gerência e está pronta para publicação:</p>
          
          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #16a34a;">📋 Vaga Aprovada</h3>
            <p><strong>Título:</strong> {{jobTitle}}</p>
            <p><strong>Departamento:</strong> {{department}}</p>
            <p><strong>Localização:</strong> {{city}}, {{state}}</p>
            <p><strong>Aprovado por:</strong> {{senderName}}</p>
            {{#notes}}<p><strong>Observações:</strong> {{notes}}</p>{{/notes}}
          </div>
          
          <p>{{#isRH}}Acesse o portal para publicar a vaga.{{/isRH}}{{#isCoordinator}}Sua solicitação foi aprovada e será publicada pelo RH.{{/isCoordinator}}</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://vagas.grupocgb.com.br/admin" style="background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              🚀 Acessar Portal
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
        <header style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">❌ Solicitação Rejeitada</h1>
        </header>
        <main style="padding: 30px 20px; background: white;">
          <p>Olá <strong>{{recipientName}}</strong>,</p>
          
          <p>Sua solicitação de vaga foi rejeitada pela gerência:</p>
          
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #dc2626;">📋 Solicitação Rejeitada</h3>
            <p><strong>Título:</strong> {{jobTitle}}</p>
            <p><strong>Departamento:</strong> {{department}}</p>
            <p><strong>Localização:</strong> {{city}}, {{state}}</p>
            <p><strong>Rejeitado por:</strong> {{senderName}}</p>
            {{#notes}}<p><strong>Motivo:</strong> {{notes}}</p>{{/notes}}
          </div>
          
          <p>Você pode revisar os detalhes e criar uma nova solicitação se necessário.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://vagas.grupocgb.com.br/admin" style="background: #6a0b27; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              📝 Acessar Portal
            </a>
          </div>
        </main>
        <footer style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
          <p style="margin: 0;">Portal CGB Vagas - Sistema Automatizado</p>
        </footer>
      </div>
    `
  },

  job_published: {
    subject: '🚀 Vaga Publicada com Sucesso - {{jobTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🚀 Vaga Publicada</h1>
        </header>
        <main style="padding: 30px 20px; background: white;">
          <p>Olá <strong>{{recipientName}}</strong>,</p>
          
          <p>A vaga foi publicada com sucesso e já está recebendo candidaturas:</p>
          
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #2563eb;">📋 Vaga Ativa</h3>
            <p><strong>Título:</strong> {{jobTitle}}</p>
            <p><strong>Departamento:</strong> {{department}}</p>
            <p><strong>Localização:</strong> {{city}}, {{state}}</p>
            <p><strong>Publicado por:</strong> {{senderName}}</p>
          </div>
          
          <p>A vaga está disponível no site público e você pode acompanhar as candidaturas no portal administrativo.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://vagas.grupocgb.com.br/admin" style="background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              👥 Ver Candidaturas
            </a>
          </div>
        </main>
        <footer style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
          <p style="margin: 0;">Portal CGB Vagas - Sistema Automatizado</p>
        </footer>
      </div>
    `
  },

  candidate_legal_validation: {
    subject: '⚖️ Validação Jurídica Necessária - {{candidateName}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">⚖️ Validação Jurídica</h1>
        </header>
        <main style="padding: 30px 20px; background: white;">
          <p>Olá <strong>{{recipientName}}</strong>,</p>
          
          <p>Um candidato chegou à etapa de Validação Jurídica e precisa da sua análise:</p>
          
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #d97706;">👤 Candidato para Validação</h3>
            <p><strong>Nome:</strong> {{candidateName}}</p>
            <p><strong>Email:</strong> {{candidateEmail}}</p>
            <p><strong>Vaga:</strong> {{jobTitle}}</p>
            <p><strong>Localização:</strong> {{city}}, {{state}}</p>
          </div>
          
          <p>Acesse o portal para revisar os dados jurídicos e aprovar/reprovar o candidato.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://vagas.grupocgb.com.br/admin" style="background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              ⚖️ Validar Candidato
            </a>
          </div>
        </main>
        <footer style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
          <p style="margin: 0;">Portal CGB Vagas - Sistema Automatizado</p>
        </footer>
      </div>
    `
  },

  legal_validation_approved: {
    subject: '✅ Validação Jurídica Aprovada - {{candidateName}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">✅ Validação Aprovada</h1>
        </header>
        <main style="padding: 30px 20px; background: white;">
          <p>Olá <strong>{{recipientName}}</strong>,</p>
          
          <p>A validação jurídica foi concluída com sucesso:</p>
          
          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #16a34a;">👤 Candidato Aprovado</h3>
            <p><strong>Nome:</strong> {{candidateName}}</p>
            <p><strong>Vaga:</strong> {{jobTitle}}</p>
            <p><strong>Status:</strong> Aprovado pelo Jurídico</p>
            {{#notes}}<p><strong>Observações:</strong> {{notes}}</p>{{/notes}}
          </div>
          
          <p>O candidato pode prosseguir para as próximas etapas do processo seletivo.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://vagas.grupocgb.com.br/admin" style="background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              👥 Ver Processo
            </a>
          </div>
        </main>
        <footer style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
          <p style="margin: 0;">Portal CGB Vagas - Sistema Automatizado</p>
        </footer>
      </div>
    `
  },

  legal_validation_rejected: {
    subject: '❌ Validação Jurídica Rejeitada - {{candidateName}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">❌ Validação Rejeitada</h1>
        </header>
        <main style="padding: 30px 20px; background: white;">
          <p>Olá <strong>{{recipientName}}</strong>,</p>
          
          <p>A validação jurídica foi rejeitada:</p>
          
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #dc2626;">👤 Candidato Rejeitado</h3>
            <p><strong>Nome:</strong> {{candidateName}}</p>
            <p><strong>Vaga:</strong> {{jobTitle}}</p>
            <p><strong>Status:</strong> Rejeitado pelo Jurídico</p>
            {{#notes}}<p><strong>Motivo:</strong> {{notes}}</p>{{/notes}}
          </div>
          
          <p>O candidato foi automaticamente movido para "Reprovado" no processo seletivo.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://vagas.grupocgb.com.br/admin" style="background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              👥 Ver Processo
            </a>
          </div>
        </main>
        <footer style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
          <p style="margin: 0;">Portal CGB Vagas - Sistema Automatizado</p>
        </footer>
      </div>
    `
  },

  candidate_hired: {
    subject: '🎉 Candidato Contratado - {{candidateName}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🎉 Candidato Contratado</h1>
        </header>
        <main style="padding: 30px 20px; background: white;">
          <p>Olá <strong>{{recipientName}}</strong>,</p>
          
          <p>Temos uma nova contratação para comemorar:</p>
          
          <div style="background: #faf5ff; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #7c3aed;">👤 Novo Colaborador</h3>
            <p><strong>Nome:</strong> {{candidateName}}</p>
            <p><strong>Vaga:</strong> {{jobTitle}}</p>
            <p><strong>Departamento:</strong> {{department}}</p>
            <p><strong>Localização:</strong> {{city}}, {{state}}</p>
          </div>
          
          <p>Parabéns pela conclusão bem-sucedida do processo seletivo!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://vagas.grupocgb.com.br/admin" style="background: #8b5cf6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              👥 Ver Contratados
            </a>
          </div>
        </main>
        <footer style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
          <p style="margin: 0;">Portal CGB Vagas - Sistema Automatizado</p>
        </footer>
      </div>
    `
  }
};

// Função para processar templates (substituir variáveis)
function processTemplate(template: string, data: any): string {
  let processed = template;

  // Substituir variáveis simples {{variable}}
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, data[key] || '');
  });

  // Processar condicionais {{#variable}}...{{/variable}}
  processed = processed.replace(/{{#(\w+)}}(.*?){{\/\1}}/gs, (match, key, content) => {
    return data[key] ? content : '';
  });

  return processed;
}

serve(async (req) => {
  console.log(`📨 Notification request: ${req.method} ${req.url}`);
  
  // 🔥 Obter origin da requisição para CORS dinâmico
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

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

        // Usar a função send-email existente
        const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({
            to: recipient.email,
            subject,
            html,
            fromName: 'Portal CGB Vagas',
            fromEmail: 'naoresponda@grupocgb.com.br'
          })
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error(`Erro ao enviar email para ${recipient.email}:`, errorText);
          results.push({ recipient: recipient.email, status: 'error', error: errorText });
        } else {
          console.log(`✅ Email enviado para ${recipient.email}`);
          results.push({ recipient: recipient.email, status: 'success' });
        }

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
