import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, FileText, MapPin, Briefcase } from 'lucide-react';
import { type SelectionStatus } from '@/lib/constants';
import { useNotifications } from './useNotifications';
import { getUsersByRole, getRHByCandidate } from '@/utils/notifications';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  job_id: string | null;
  status: SelectionStatus | 'pending' | 'approved' | 'rejected' | 'interview';
  applied_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  legal_validation_comment?: string | null;
  tj_validation_started_at?: string | null;
  resume_file_url?: string | null;
  resume_file_name?: string | null;
  cnh?: string | null;
  vehicle?: string | null;
  // Campos adicionais do formulário de candidatura
  workedAtCGB?: string | null;
  pcd?: string | null;
  travel?: string | null;
  age?: string | null;
  whatsapp?: string | null;
  desiredJob?: string | null;
  job?: {
    title: string;
    city: string;
    state: string;
  };
}

// Criando um tipo específico para a criação de um novo candidato
export type NewCandidate = Omit<Candidate, 'id' | 'created_at' | 'updated_at' | 'applied_date' | 'job'>;

/**
 * Hook para buscar TODOS os candidatos do sistema.
 * 
 * ⚠️ ATENÇÃO: Este hook tem limite de 1000 registros do Supabase por padrão.
 * Para telas que precisam de contagem exata ou muitos registros, use:
 * - useCandidatesByJob() para filtrar por vaga específica (server-side)
 * - count('exact') para contagens totais
 * - Paginação com .range() para grandes volumes
 * 
 * Este hook é adequado para:
 * - Visualizações administrativas gerais (< 1000 candidatos)
 * - Dropdowns e seletores
 * - Dashboards que não dependem de contagem exata
 */
export const useCandidates = () => {
  return useQuery({
    queryKey: ['candidates', 'unlimited', 'v3'], // BUG FIX: Nova queryKey para forçar refresh total
    queryFn: async () => {
      console.log('🔄 useCandidates: Buscando TODOS os candidatos (SEM LIMITE)...');

      // BUG FIX FINAL: Buscar em lotes de 1000 até pegar tudo
      let allCandidates: any[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error, count } = await supabase
          .from('candidates')
          .select(`
            *,
            job:jobs(title, city, state, department)
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, from + batchSize - 1);

        if (error) {
          console.error("❌ Erro ao buscar candidatos:", error);
          throw error;
        }

        if (data && data.length > 0) {
          allCandidates = [...allCandidates, ...data];
          console.log(`📥 Lote ${Math.floor(from / batchSize) + 1}: ${data.length} candidatos (Total acumulado: ${allCandidates.length})`);
          from += batchSize;

          // Se retornou menos que batchSize, não há mais dados
          if (data.length < batchSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }

        // Segurança: máximo 20 lotes (20.000 candidatos)
        if (from >= 20000) {
          console.warn('⚠️ Limite de segurança atingido (20.000 candidatos)');
          hasMore = false;
        }
      }

      console.log(`✅ useCandidates: ${allCandidates.length} candidatos carregados (TOTAL REAL)`);

      return allCandidates;
    },
    select: (data): Candidate[] => {
      if (!Array.isArray(data)) return [];
      return data.map(c => ({
        ...c,
        city: c.city || c.job?.city,
        state: c.state || c.job?.state,
      })) as Candidate[];
    }
  });
};

// Hook para buscar currículo por email (fallback para candidatos antigos)
export const useResumeByEmail = (email: string) => {
  return useQuery({
    queryKey: ['resume-by-email', email],
    queryFn: async () => {
      if (!email) return null;

      const { data, error } = await supabase
        .from('resumes')
        .select('resume_file_url, resume_file_name')
        .eq('email', email)
        .single();

      if (error) {
        console.log('Nenhum currículo encontrado para:', email);
        return null;
      }
      return data;
    },
    enabled: !!email,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useCreateCandidate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (candidate: NewCandidate) => {
      const { data, error } = await supabase
        .from('candidates')
        .insert([candidate])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
};

export const useUpdateCandidateStatus = () => {
  const queryClient = useQueryClient();
  const { sendNotification } = useNotifications();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      legal_validation_comment
    }: {
      id: string;
      status: Candidate['status'];
      legal_validation_comment?: string;
    }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Adicionar comentário de validação jurídica se fornecido
      if (legal_validation_comment !== undefined) {
        updateData.legal_validation_comment = legal_validation_comment;
      }

      const { data, error } = await supabase
        .from('candidates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      // Opcional: atualizar o candidato específico no cache para uma resposta mais rápida da UI
      queryClient.setQueryData(['candidate', variables.id], data);

      // Enviar notificações para status importantes
      try {
        if (variables.status === 'Validação TJ') {
          // Notificar jurídico quando candidato chega para validação
          const juridicos = await getUsersByRole('juridico');
          if (juridicos.length > 0) {
            await sendNotification({
              type: 'candidate_legal_validation',
              recipients: juridicos,
              data: {
                candidateName: data.name,
                candidateEmail: data.email,
                candidateId: data.id,
                jobTitle: data.job?.title || data.desiredJob,
                city: data.city || data.job?.city,
                state: data.state || data.job?.state,
                actionDate: new Date().toLocaleString('pt-BR')
              },
              silent: true
            });
          }
        } else if (variables.status === 'Contratado') {
          // Notificar stakeholders quando candidato é contratado
          const rhUsers = await getRHByCandidate(data.id);
          if (rhUsers.length > 0) {
            await sendNotification({
              type: 'candidate_hired',
              recipients: rhUsers,
              data: {
                candidateName: data.name,
                candidateEmail: data.email,
                candidateId: data.id,
                jobTitle: data.job?.title || data.desiredJob,
                department: data.job?.department,
                city: data.city || data.job?.city,
                state: data.state || data.job?.state,
                actionDate: new Date().toLocaleString('pt-BR')
              },
              silent: true
            });
          }
        }
      } catch (error) {
        console.error('Erro ao enviar notificação de mudança de status:', error);
      }
    },
  });
};

export const useDeleteCandidate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (candidate: Candidate) => {
      // 1. Deletar o arquivo do currículo do Storage
      if (candidate.resume_file_url) {
        const fullPath = new URL(candidate.resume_file_url).pathname;
        const filePath = fullPath.substring(fullPath.indexOf('/resumes/') + '/resumes/'.length);

        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from('resumes')
            .remove([filePath]);
          if (storageError) {
            console.error("Erro ao deletar currículo do Storage:", storageError);
          }
        }
      }

      // 2. Deletar o registro do candidato do banco de dados
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidate.id);

      if (error) {
        throw error;
      }

      return candidate.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
};
