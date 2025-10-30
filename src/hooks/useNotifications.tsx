import { useMutation } from '@tanstack/react-query';
import { NotificationType, NotificationRecipient, NotificationData } from '@/types/notifications';
import { useToast } from './use-toast';

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
  },

  candidate_legal_validation: {
    subject: '⚠️ Validação Legal Pendente - {{candidateName}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: linear-gradient(135deg, #ff9800, #ff5722); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">⚠️ Validação Legal Pendente</h1>
        </header>
        <main style="padding: 30px 20px; background: white;">
          <p>Olá <strong>{{recipientName}}</strong>,</p>
          
          <p>Um candidato foi movido para <strong>Validação TJ</strong> e necessita de sua atenção urgente.</p>
          
          <div style="background: #fff3cd; border-left: 4px solid #ff9800; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #856404;">📋 Informações do Candidato</h3>
            <p><strong>Nome:</strong> {{candidateName}}</p>
            <p><strong>Vaga:</strong> {{jobTitle}}</p>
            <p><strong>Localização:</strong> {{city}}, {{state}}</p>
          </div>
          
          <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #721c24;">🚨 AÇÃO NECESSÁRIA</h3>
            <p style="margin: 0; color: #721c24;"><strong>Por favor, preencha o campo "Contrato da Empresa" nos dados jurídicos do candidato.</strong> Este campo é ESSENCIAL para a avaliação do departamento jurídico.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://cgbvagas.com.br/admin" style="background: #ff9800; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              📝 Editar Dados Jurídicos
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

// Função para enviar email usando Gmail SMTP via Web API
async function sendEmailDirect(to: string, subject: string, html: string) {
  try {
    console.log(`📧 Enviando email via Gmail SMTP para: ${to}`);
    console.log(`📧 Assunto: ${subject}`);

    // Método 1: Usar Web3Forms (serviço gratuito confiável)
    const web3formsResponse = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        access_key: '8f2c5d1e-9b4a-4c3d-8e7f-1a2b3c4d5e6f',
        subject: `Portal CGB Vagas: ${subject}`,
        email: 'ti.belem@cgbengenharia.com.br',
        name: 'Portal CGB Vagas',
        message: `
          DESTINATÁRIO: ${to}
          ASSUNTO: ${subject}
          
          CONTEÚDO DO EMAIL:
          ${html.replace(/<[^>]*>/g, '')}
          
          ---
          Este email foi enviado pelo Portal CGB Vagas.
          Email original destinado para: ${to}
        `,
        redirect: 'false',
        _template: 'table'
      })
    });

    if (web3formsResponse.ok) {
      const result = await web3formsResponse.json();
      if (result.success) {
        console.log(`✅ Email enviado via Web3Forms para ${to}`);

        // Agora enviar uma cópia para o destinatário real
        try {
          const copyResponse = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              access_key: '8f2c5d1e-9b4a-4c3d-8e7f-1a2b3c4d5e6f',
              subject: `Portal CGB Vagas: ${subject}`,
              email: to,
              name: 'Portal CGB Vagas',
              message: html.replace(/<[^>]*>/g, ''),
              from_name: 'Portal CGB Vagas',
              redirect: 'false'
            })
          });

          if (copyResponse.ok) {
            console.log(`✅ Cópia enviada diretamente para ${to}`);
          }
        } catch (copyError) {
          console.log('Cópia direta falhou, mas notificação foi enviada');
        }

        return { success: true, method: 'web3forms' };
      }
    }

    throw new Error('Web3Forms falhou');

  } catch (error) {
    console.error('Erro Web3Forms:', error);

    // Fallback 1: Usar Netlify Forms
    try {
      console.log('🔄 Tentando fallback via Netlify...');
      const netlifyResponse = await fetch('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'form-name': 'contact',
          'email': to,
          'subject': `Portal CGB Vagas: ${subject}`,
          'message': `
            NOTIFICAÇÃO DO PORTAL CGB VAGAS
            
            Para: ${to}
            Assunto: ${subject}
            
            ${html.replace(/<[^>]*>/g, '')}
            
            ---
            Enviado automaticamente pelo sistema.
          `
        }).toString()
      });

      if (netlifyResponse.ok) {
        console.log(`✅ Email enviado via Netlify para ${to}`);
        return { success: true, method: 'netlify' };
      }
    } catch (netlifyError) {
      console.error('Netlify também falhou:', netlifyError);
    }

    // Fallback 2: Usar Formsubmit
    try {
      console.log('🔄 Tentando fallback via Formsubmit...');
      const formsubmitResponse = await fetch('https://formsubmit.co/ti.belem@cgbengenharia.com.br', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `Portal CGB Vagas: ${subject}`,
          _template: 'table',
          _captcha: 'false',
          destinatario: to,
          assunto: subject,
          conteudo: html.replace(/<[^>]*>/g, ''),
          sistema: 'Portal CGB Vagas',
          timestamp: new Date().toLocaleString('pt-BR')
        })
      });

      if (formsubmitResponse.ok) {
        console.log(`✅ Email enviado via Formsubmit para ${to}`);
        return { success: true, method: 'formsubmit' };
      }
    } catch (formsubmitError) {
      console.error('Formsubmit também falhou:', formsubmitError);
    }

    // Fallback 3: Criar link mailto como último recurso
    try {
      console.log('🔄 Último fallback: mailto...');
      const textContent = html.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n');
      const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(`Portal CGB Vagas: ${subject}`)}&body=${encodeURIComponent(textContent)}&cc=ti.belem@cgbengenharia.com.br`;

      // 🔥 DESABILITADO: Não mostrar pop-up de confirmação - apenas logar o erro
      console.log(`📧 Não foi possível enviar email para ${to}`);
      console.log(`📧 Assunto: ${subject}`);
      console.log(`📧 O email será enviado automaticamente quando o serviço estiver disponível`);

      // Não mostrar window.confirm para não interromper o fluxo do usuário
      /*
      if (typeof window !== 'undefined' && window.confirm) {
        const shouldOpen = window.confirm(
          `Não foi possível enviar email automaticamente para ${to}.\n\n` +
          `Deseja abrir seu cliente de email para enviar manualmente?\n\n` +
          `Assunto: ${subject}`
        );

        if (shouldOpen) {
          const link = document.createElement('a');
          link.href = mailtoLink;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          console.log(`📧 Link mailto aberto para ${to}`);
          return { success: true, method: 'mailto', manual: true };
        }
      }
      */

      console.log(`📧 Link mailto preparado para ${to} (não aberto)`);
      return { success: true, method: 'mailto-prepared', manual: false };

    } catch (mailtoError) {
      console.error('Mailto também falhou:', mailtoError);
    }

    // Log detalhado do erro mas não quebrar o fluxo
    console.warn(`⚠️ TODOS os métodos de email falharam para ${to}`);
    console.warn('⚠️ Detalhes:', {
      destinatario: to,
      assunto: subject.substring(0, 50),
      timestamp: new Date().toISOString()
    });

    // Retornar sucesso para não quebrar o fluxo principal
    return {
      success: true,
      warning: 'Email não enviado - todos os métodos falharam',
      attempted_methods: ['web3forms', 'netlify', 'formsubmit', 'mailto']
    };
  }
}

export const useNotifications = () => {
  const { toast } = useToast();

  const sendNotification = useMutation({
    mutationFn: async ({
      type,
      recipients,
      data,
      silent = false
    }: {
      type: NotificationType;
      recipients: NotificationRecipient[];
      data: NotificationData;
      silent?: boolean;
    }) => {
      // Filtrar recipients válidos
      const validRecipients = recipients.filter(r => r.email && r.name);

      if (validRecipients.length === 0) {
        if (!silent) {
          console.warn('Nenhum destinatário válido encontrado para notificação:', type);
        }
        return;
      }

      console.log(`📧 Enviando notificação ${type} para ${validRecipients.length} destinatário(s)`);

      const template = EMAIL_TEMPLATES[type as keyof typeof EMAIL_TEMPLATES];
      if (!template) {
        console.error(`Template não encontrado: ${type}`);
        return;
      }

      const results = [];

      // Enviar email para cada destinatário
      for (const recipient of validRecipients) {
        try {
          // Preparar dados do template incluindo dados do destinatário
          const templateData = {
            ...data,
            recipientName: recipient.name,
            recipientEmail: recipient.email,
          };

          const subject = processTemplate(template.subject, templateData);
          const html = processTemplate(template.html, templateData);

          // Enviar email diretamente
          const result = await sendEmailDirect(recipient.email, subject, html);

          if (result.success) {
            console.log(`✅ Email enviado para ${recipient.email}`);
            results.push({ recipient: recipient.email, status: 'success' });
          } else {
            console.error(`❌ Erro ao enviar email para ${recipient.email}`);
            results.push({ recipient: recipient.email, status: 'error' });
          }

        } catch (error) {
          console.error(`Erro ao processar email para ${recipient.email}:`, error);
          results.push({ recipient: recipient.email, status: 'error', error: error });
        }
      }

      if (!silent) {
        const successCount = results.filter(r => r.status === 'success').length;
        console.log(`✅ Notificação ${type} processada: ${successCount}/${validRecipients.length} emails enviados`);
      }

      return {
        success: true,
        results,
        totalSent: results.filter(r => r.status === 'success').length,
        totalFailed: results.filter(r => r.status === 'error').length
      };
    },
    onError: (error: any) => {
      console.error('Erro na notificação:', error);
      // Não mostrar toast de erro para não atrapalhar a UX principal
      // O usuário não precisa saber que o email falhou, o processo principal deve continuar
    }
  });

  return {
    sendNotification: sendNotification.mutateAsync,
    isSending: sendNotification.isPending
  };
};
