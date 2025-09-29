import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Job {
  id: string;
  title: string;
  department: string;
  city: string;
  state: string;
  type: 'CLT' | 'Estágio' | 'Aprendiz' | 'Terceirizado' | 'PJ' | 'Temporário';
  description: string;
  requirements: string[];
  benefits: string[];
  workload: string;
  status: 'draft' | 'active' | 'closed' | 'inactive';
  approval_status?: 'rascunho' | 'aprovacao_pendente' | 'ativo' | 'rejeitado' | 'fechado' | 'draft' | 'pending_approval' | 'active' | 'rejected' | 'closed';
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  applicants?: number;
  posted?: string;
  quantity?: number; // Quantidade de vagas
  quantity_filled?: number; // Quantidade de vagas preenchidas
  expires_at?: string; // Data de expiração
  hired_count?: number; // Candidatos contratados/aprovados
  solicitante_nome?: string; // Nome do solicitante para controle interno
  solicitante_funcao?: string; // Função/contrato do solicitante para controle interno
  observacoes_internas?: string; // Observações internas para controle
  tipo_solicitacao?: string; // Tipo de solicitação: aumento_quadro, substituicao
  nome_substituido?: string; // Nome da pessoa substituída (quando tipo = substituicao)
  flow_status?: 'ativa' | 'concluida' | 'congelada'; // Status do fluxo da vaga (controla visibilidade)
}

export const useJobs = () => {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      try {
        // Primeiro buscar as vagas ativas e aprovadas COM flow_status = 'ativa'
        const { data: jobs, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .eq('status', 'active')
          .eq('approval_status', 'active')
          .eq('flow_status', 'ativa')
          .order('created_at', { ascending: false });

        if (jobsError) {
          console.error('Erro ao buscar vagas:', jobsError);
          throw jobsError;
        }

        if (!jobs || jobs.length === 0) {
          return [];
        }

        // Buscar contagem de candidatos para cada vaga
        const jobsWithApplicants = await Promise.all(
          jobs.map(async (job) => {
            try {
              const { count, error: countError } = await supabase
                .from('candidates')
                .select('id', { count: 'exact', head: true })
                .eq('job_id', job.id);

              if (countError) {
                console.warn('Erro ao contar candidates para vaga', job.id, ':', countError);
              }

              return {
                ...job,
                applicants: count || 0,
                posted: new Date(job.created_at).toLocaleDateString('pt-BR')
              };
            } catch (error) {
              console.warn('Erro ao processar vaga', job.id, ':', error);
              return {
                ...job,
                applicants: 0,
                posted: new Date(job.created_at).toLocaleDateString('pt-BR')
              };
            }
          })
        );

        // Garantir que apenas um "Banco de Talentos" apareça na administração
        // Preferimos o que está ativo; se não houver ativo, mantemos o mais recente
        const nonTalentJobs = jobsWithApplicants.filter(j => j.title !== 'Banco de Talentos');
        const talentJobs = jobsWithApplicants.filter(j => j.title === 'Banco de Talentos');

        let chosenTalentJob: typeof jobsWithApplicants[number] | undefined =
          talentJobs.find(j => (j.approval_status === 'active' || j.status === 'active')) ||
          talentJobs[0];

        const dedupedJobs = chosenTalentJob ? [chosenTalentJob, ...nonTalentJobs] : nonTalentJobs;

        return dedupedJobs;
      } catch (error) {
        console.error('Erro geral ao buscar vagas:', error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useAllJobs = () => {
  return useQuery({
    queryKey: ['allJobs'],
    queryFn: async () => {
      try {
        const { data: jobs, error } = await supabase
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!jobs || jobs.length === 0) {
          return [];
        }

        // Buscar contagem de candidatos para cada vaga
        const jobsWithApplicants = await Promise.all(
          jobs.map(async (job) => {
            try {
              const { count, error: countError } = await supabase
                .from('candidates')
                .select('id', { count: 'exact', head: true })
                .eq('job_id', job.id);

              if (countError) {
                console.warn('Erro ao contar candidates:', countError);
              }

              // Contar candidatos contratados/aprovados
              const { count: hiredCount, error: hiredError } = await supabase
                .from('candidates')
                .select('id', { count: 'exact', head: true })
                .eq('job_id', job.id)
                .in('status', ['Contratado', 'Aprovado']);

              if (hiredError) {
                console.warn('Erro ao contar candidatos contratados:', hiredError);
              }

              return {
                ...job,
                applicants: count || 0,
                hired_count: hiredCount || 0,
                posted: new Date(job.created_at).toLocaleDateString('pt-BR')
              };
            } catch (error) {
              return {
                ...job,
                applicants: 0,
                hired_count: 0,
                posted: new Date(job.created_at).toLocaleDateString('pt-BR')
              };
            }
          })
        );

        return jobsWithApplicants;
      } catch (error) {
        console.error('Erro ao buscar todas as vagas:', error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });
};

export const useJobById = (id: string) => {
  return useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const { data: job, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Erro ao buscar vaga ${id}:`, error);
        throw error;
      }
      if (!job) {
        return null;
      }

      // Buscar contagem de candidatos
      const { count, error: countError } = await supabase
        .from('candidates')
        .select('id', { count: 'exact', head: true })
        .eq('job_id', job.id);

      if (countError) {
        console.warn('Erro ao contar candidates para vaga', job.id, ':', countError);
      }

      // Processar o job para garantir consistência de dados
      return {
        ...job,
        workload: job.workload || 'Não informado',
        applicants: count || 0,
        posted: new Date(job.created_at).toLocaleDateString('pt-BR'),
        requirements: Array.isArray(job.requirements) ? job.requirements : [],
        benefits: Array.isArray(job.benefits) ? job.benefits : [],
      };
    },
    enabled: !!id,
  });
};

export const usePendingJobs = (rhProfile: RHUser | null | undefined) => {
  return useQuery<Job[], Error>({
    queryKey: ['pendingJobs', rhProfile?.user_id],
    queryFn: async () => {
      console.log('🔍 [usePendingJobs] Perfil:', rhProfile?.role, 'is_admin:', rhProfile && 'is_admin' in rhProfile ? rhProfile.is_admin : 'N/A');

      // Se o usuário é um gerente, mas não tem regiões atribuídas, não retorna nada.
      const isManagerWithNoRegions =
        rhProfile?.role === 'manager' &&
        (!rhProfile.assigned_states || rhProfile.assigned_states.length === 0) &&
        (!rhProfile.assigned_cities || rhProfile.assigned_cities.length === 0);

      if (isManagerWithNoRegions) {
        console.log('❌ [usePendingJobs] Gerente sem regiões, retornando vazio');
        return [];
      }

      let query = supabase
        .from('jobs')
        .select('*')
        .eq('approval_status', 'pending_approval');

      // Aplica filtro de região apenas para gerentes (ADMIN vê todas)
      if (rhProfile && rhProfile.role === 'manager') {
        console.log('🔧 [usePendingJobs] Aplicando filtro de região para GERENTE');

        // PRIORIDADE 1: Se tem estados atribuídos, verificar se inclui o estado da vaga
        if (rhProfile.assigned_states && rhProfile.assigned_states.length > 0) {
          query = query.in('state', rhProfile.assigned_states);

          // Se tem o estado E tem cidades específicas, também filtrar por cidade
          if (rhProfile.assigned_cities && rhProfile.assigned_cities.length > 0) {
            query = query.in('city', rhProfile.assigned_cities);
          }
        }
        // PRIORIDADE 2: Se não tem estados, mas tem cidades específicas
        else if (rhProfile.assigned_cities && rhProfile.assigned_cities.length > 0) {
          query = query.in('city', rhProfile.assigned_cities);
        }
      } else {
        console.log('✅ [usePendingJobs] ADMIN ou outro perfil - sem filtro de região');
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      console.log('📊 [usePendingJobs] Resultado:', data?.length || 0, 'vagas encontradas');

      if (error) {
        console.error('Erro ao buscar vagas pendentes:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!rhProfile,
  });
};

export const useJobsRobust = () => {
  // ... (código)
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (job: Omit<Job, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('jobs')
        .insert([job])
        .select()
        .single();

      if (error) {
        console.error('❌ [useCreateJob] Erro do Supabase:', error);

        // Tratamento específico para erro de RLS
        if (error.code === '42501') {
          throw new Error('Erro de permissão: Você precisa estar logado para criar vagas. Tente fazer logout e login novamente.');
        }

        // Outros erros específicos
        if (error.code === 'PGRST116') {
          throw new Error('Tabela não encontrada. Contate o administrador.');
        }

        throw new Error(`Erro ao criar vaga: ${error.message || 'Erro desconhecido'}`);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['allJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobsRobust'] });
    },
    onError: (error) => {
      console.error("Erro ao criar vaga:", error);
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...job }: Partial<Job> & { id: string }) => {
      // Filtrar campos que não existem na tabela 'jobs'
      const {
        applicants,
        posted,
        hired_count,
        ...validJobFields
      } = job;

      const { data, error } = await supabase
        .from('jobs')
        .update(validJobFields)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['allJobs'] });
      queryClient.invalidateQueries({ queryKey: ['pendingJobs'] });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['allJobs'] });
    },
  });
};

export const useUpdateJobFlowStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, flowStatus }: { jobId: string; flowStatus: 'ativa' | 'concluida' | 'congelada' }) => {
      const { data, error } = await supabase
        .from('jobs')
        .update({ flow_status: flowStatus })
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['allJobs'] });
    },
  });
};
