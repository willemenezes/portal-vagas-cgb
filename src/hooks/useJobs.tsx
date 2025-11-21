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
  // Campos de criação e aprovação
  created_by?: string; // ID do usuário que criou
  created_by_name?: string; // Nome do usuário que criou
  approved_by?: string; // ID do usuário que aprovou
  approved_by_name?: string; // Nome do usuário que aprovou
  approved_at?: string; // Data de aprovação
  // Campos de justificativa
  is_justificativa?: boolean; // Se tem justificativa
  justification?: string; // Texto da justificativa
  // Campo de contrato da empresa (CT)
  company_contract?: string; // Contrato da empresa (CT) relacionado à vaga
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
          // Aceitar tanto inglês quanto português para compatibilidade de dados
          .in('status', ['active', 'ativo'])
          .in('approval_status', ['active', 'ativo'])
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
          talentJobs.find(j => (['active', 'ativo'].includes(j.approval_status as any) || ['active', 'ativo'].includes(j.status as any))) ||
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
        // Otimizado: processar em lotes para evitar sobrecarga do servidor
        const jobsWithApplicants: Job[] = [];
        const batchSize = 10; // Processar 10 vagas por vez
        
        for (let i = 0; i < jobs.length; i += batchSize) {
          const batch = jobs.slice(i, i + batchSize);
          
          const batchResults = await Promise.all(
            batch.map(async (job) => {
              try {
                // Adicionar pequeno delay para evitar rate limiting
                if (i > 0) {
                  await new Promise(resolve => setTimeout(resolve, 50));
                }

                const { count, error: countError } = await supabase
                  .from('candidates')
                  .select('id', { count: 'exact', head: true })
                  .eq('job_id', job.id);

                if (countError) {
                  console.warn(`Erro ao contar candidates para vaga ${job.id}:`, countError);
                }

                // Contar candidatos contratados/aprovados com retry
                let hiredCount = 0;
                let retries = 0;
                const maxRetries = 2;

                while (retries <= maxRetries) {
                  try {
                    const { count: countResult, error: hiredError } = await supabase
                      .from('candidates')
                      .select('id', { count: 'exact', head: true })
                      .eq('job_id', job.id)
                      .in('status', ['Contratado', 'Aprovado']);

                    if (hiredError) {
                      if (hiredError.code === 'PGRST116' || hiredError.message?.includes('503')) {
                        // Erro 503 ou timeout - tentar novamente
                        if (retries < maxRetries) {
                          retries++;
                          await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Backoff exponencial
                          continue;
                        }
                      }
                      console.warn(`Erro ao contar candidatos contratados para vaga ${job.id}:`, hiredError);
                      break;
                    }
                    hiredCount = countResult || 0;
                    break;
                  } catch (error) {
                    if (retries < maxRetries) {
                      retries++;
                      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
                      continue;
                    }
                    console.warn(`Erro ao contar candidatos contratados para vaga ${job.id}:`, error);
                    break;
                  }
                }

                return {
                  ...job,
                  applicants: count || 0,
                  hired_count: hiredCount,
                  posted: new Date(job.created_at).toLocaleDateString('pt-BR')
                };
              } catch (error) {
                console.warn(`Erro ao processar vaga ${job.id}:`, error);
                return {
                  ...job,
                  applicants: 0,
                  hired_count: 0,
                  posted: new Date(job.created_at).toLocaleDateString('pt-BR')
                };
              }
            })
          );

          jobsWithApplicants.push(...batchResults);
        }

        return jobsWithApplicants;
      } catch (error) {
        console.error('Erro ao buscar todas as vagas:', error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 30 * 1000, // 30 segundos (reduzido para atualizações mais frequentes)
    refetchOnMount: true, // Refaz a busca ao montar o componente
    refetchOnWindowFocus: true, // Busca dados ao focar na janela
    refetchInterval: 60 * 1000, // Refetch automático a cada 1 minuto
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

      let query = supabase
        .from('jobs')
        .select('*')
        .eq('approval_status', 'pending_approval')
        .order('created_at', { ascending: false });

      // NOVO: Filtro por departamento para gerentes
      if (rhProfile?.role === 'manager' && rhProfile.assigned_departments && rhProfile.assigned_departments.length > 0) {
        console.log('🔍 [usePendingJobs] Filtrando por departamentos:', rhProfile.assigned_departments);
        query = query.in('department', rhProfile.assigned_departments);
      }

      // Filtro por região (Estado/Cidade)
      if (rhProfile?.assigned_states && rhProfile.assigned_states.length > 0) {
        console.log('🔍 [usePendingJobs] Filtrando por estados:', rhProfile.assigned_states);
        query = query.in('state', rhProfile.assigned_states);
      }

      if (rhProfile?.assigned_cities && rhProfile.assigned_cities.length > 0) {
        console.log('🔍 [usePendingJobs] Filtrando por cidades:', rhProfile.assigned_cities);
        query = query.in('city', rhProfile.assigned_cities);
      }

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
      // BUG FIX: Invalidar TODAS as queries relacionadas para atualização automática da UI
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['allJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs-robust'] });
      queryClient.invalidateQueries({ queryKey: ['jobsRobust'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
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
      // BUG FIX: Invalidar TODAS as queries relacionadas para atualização automática da UI
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['allJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs-robust'] });
      queryClient.invalidateQueries({ queryKey: ['pendingJobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      queryClient.invalidateQueries({ queryKey: ['candidatesByJob'] });
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
      // BUG FIX: Invalidar TODAS as queries relacionadas para atualização automática da UI
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['allJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs-robust'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      queryClient.invalidateQueries({ queryKey: ['candidatesByJob'] });
    },
  });
};

export const useUpdateJobFlowStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, flowStatus }: { jobId: string; flowStatus: 'ativa' | 'concluida' | 'congelada' }) => {
      // Buscar a vaga atual para verificar o status anterior
      const { data: currentJob, error: fetchError } = await supabase
        .from('jobs')
        .select('flow_status, approval_status, status')
        .eq('id', jobId)
        .single();

      if (fetchError) throw fetchError;

      // Preparar dados para atualização
      const updateData: any = { flow_status: flowStatus };

      // FLUXO CORRIGIDO: Se uma vaga congelada está sendo ativada novamente,
      // ela deve voltar para aprovação (pending_approval) para admin/gerente revisar
      if (currentJob?.flow_status === 'congelada' && flowStatus === 'ativa') {
        updateData.approval_status = 'pending_approval';
        updateData.status = 'draft'; // Voltar para draft até ser aprovada novamente
      }

      const { data, error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // BUG FIX: Invalidar TODAS as queries relacionadas para atualização automática da UI
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['allJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs-robust'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      queryClient.invalidateQueries({ queryKey: ['candidatesByJob'] });
    },
  });
};
