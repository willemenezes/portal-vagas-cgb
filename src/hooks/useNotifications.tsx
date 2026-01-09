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
            <a href="https://vagas.grupocgb.com.br" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
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
            <a href="https://vagas.grupocgb.com.br/admin" style="background: #ff9800; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              📝 Editar Dados Jurídicos
            </a>
          </div>
        </main>
        <footer style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
          <p style="margin: 0;">Portal CGB Vagas - Sistema Automatizado</p>
        </footer>
      </div>
    `
  },

  candidate_rejected: {
    subject: '❌ Candidato Reprovado - {{candidateName}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">❌ Candidato Reprovado</h1>
        </header>
        <main style="padding: 30px 20px; background: white;">
          <p>Olá <strong>{{recipientName}}</strong>,</p>
          
          <p>Um candidato foi reprovado no processo seletivo:</p>
          
          <div style="background: #f8f9fa; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #dc3545;">📋 Informações</h3>
            <p><strong>Candidato:</strong> {{candidateName}}</p>
            <p><strong>Vaga:</strong> {{jobTitle}}</p>
            <p><strong>Departamento:</strong> {{department}}</p>
            <p><strong>Localização:</strong> {{city}}, {{state}}</p>
            <p><strong>Motivo:</strong> {{notes}}</p>
            <p><strong>Data:</strong> {{actionDate}}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://vagas.grupocgb.com.br/admin" style="background: #6a0b27; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              📊 Ver Processo Seletivo
            </a>
          </div>
        </main>
        <footer style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
          <p style="margin: 0;">Portal CGB Vagas - Sistema Automatizado</p>
        </footer>
      </div>
    `
  },

  new_application: {
    subject: '👤 Nova Candidatura - {{candidateName}} para {{jobTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">👤 Nova Candidatura Recebida</h1>
        </header>
        <main style="padding: 30px 20px; background: white;">
          <p>Olá <strong>{{recipientName}}</strong>,</p>
          
          <p>Uma nova candidatura foi recebida para uma das vagas da sua região/departamento:</p>
          
          <div style="background: #e7f3ff; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #004085;">📋 Detalhes da Candidatura</h3>
            <p><strong>Candidato:</strong> {{candidateName}}</p>
            <p><strong>Email:</strong> {{candidateEmail}}</p>
            <p><strong>Vaga:</strong> {{jobTitle}}</p>
            <p><strong>Departamento:</strong> {{department}}</p>
            <p><strong>Localização:</strong> {{city}}, {{state}}</p>
            <p><strong>Data:</strong> {{actionDate}}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://vagas.grupocgb.com.br/admin" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              👥 Ver Candidatos
            </a>
          </div>
        </main>
        <footer style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
          <p style="margin: 0;">Portal CGB Vagas - Sistema Automatizado</p>
        </footer>
      </div>
    `
  },

  job_expiring_soon: {
    subject: '⏰ Vaga Vencendo em Breve - {{jobTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: linear-gradient(135deg, #ffc107, #ff9800); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">⏰ Vaga Vencendo em Breve</h1>
        </header>
        <main style="padding: 30px 20px; background: white;">
          <p>Olá <strong>{{recipientName}}</strong>,</p>
          
          <p>Uma vaga está próxima da data de vencimento e precisa de atenção:</p>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #856404;">📋 Detalhes da Vaga</h3>
            <p><strong>Título:</strong> {{jobTitle}}</p>
            <p><strong>Departamento:</strong> {{department}}</p>
            <p><strong>Localização:</strong> {{city}}, {{state}}</p>
            <p><strong>Vence em:</strong> {{daysRemaining}} dias úteis ({{expiryDate}})</p>
            <p><strong>Vagas Restantes:</strong> {{quantity}}</p>
          </div>
          
          <div style="background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #0c5460;"><strong>💡 Ação Recomendada:</strong> Verifique se a vaga ainda é necessária ou se precisa ser prorrogada.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://vagas.grupocgb.com.br/admin" style="background: #ffc107; color: #212529; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              📝 Gerenciar Vaga
            </a>
          </div>
        </main>
        <footer style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
          <p style="margin: 0;">Portal CGB Vagas - Sistema Automatizado</p>
        </footer>
      </div>
    `
  },

  job_expired: {
    subject: '🚨 Vaga Expirada - {{jobTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: linear-gradient(135deg, #dc3545, #bd2130); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🚨 Vaga Expirada</h1>
        </header>
        <main style="padding: 30px 20px; background: white;">
          <p>Olá <strong>{{recipientName}}</strong>,</p>
          
          <p>Uma vaga atingiu a data de vencimento e foi automaticamente inativada:</p>
          
          <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #721c24;">📋 Vaga Expirada</h3>
            <p><strong>Título:</strong> {{jobTitle}}</p>
            <p><strong>Departamento:</strong> {{department}}</p>
            <p><strong>Localização:</strong> {{city}}, {{state}}</p>
            <p><strong>Data de Vencimento:</strong> {{expiryDate}}</p>
            <p><strong>Vagas Restantes:</strong> {{quantity}}</p>
          </div>
          
          <div style="background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #0c5460;"><strong>💡 Próximos Passos:</strong> Se a vaga ainda for necessária, você pode reativá-la e definir uma nova data de vencimento.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://vagas.grupocgb.com.br/admin" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              🔄 Reativar Vaga
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

// 🔥 REMOVIDO: Função sendEmailDirect não é mais necessária
// Agora usamos a Edge Function send-notification que usa SMTP direto
// Isso evita emails do FormSubmit/Web3Forms

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

      // 🔥 CORREÇÃO: Usar Edge Function send-notification em vez de sendEmailDirect
      // A Edge Function usa SMTP direto e não precisa de FormSubmit/Web3Forms
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Configuração Supabase incompleta');
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          body: JSON.stringify({
            type,
            recipients: validRecipients,
            data
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Erro ao enviar notificação via Edge Function:`, errorText);
          throw new Error(errorText);
        }

        const result = await response.json();
        
        if (!silent) {
          console.log(`✅ Notificação ${type} processada: ${result.totalSent}/${validRecipients.length} emails enviados`);
        }

        return result;

      } catch (error: any) {
        console.error('❌ Erro ao enviar notificação via Edge Function:', error);
        
        // Não mostrar toast de erro para não atrapalhar a UX principal
        // O usuário não precisa saber que o email falhou, o processo principal deve continuar
        
        return {
          success: false,
          results: validRecipients.map(r => ({ recipient: r.email, status: 'error', error: error.message })),
          totalSent: 0,
          totalFailed: validRecipients.length
        };
      }
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
