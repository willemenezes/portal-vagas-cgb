import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NotificationType, NotificationRecipient, NotificationData } from '@/types/notifications';
import { useToast } from './use-toast';

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

      const { data: result, error } = await supabase.functions.invoke('send-notification', {
        body: {
          type,
          recipients: validRecipients,
          data
        }
      });

      if (error) {
        console.error('Erro ao enviar notificação:', error);
        throw new Error(`Erro ao enviar notificação: ${error.message}`);
      }

      if (!silent) {
        console.log(`✅ Notificação ${type} enviada com sucesso`);
      }

      return result;
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
