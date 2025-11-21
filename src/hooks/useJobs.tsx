import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  // Campos de soft delete (exclusão lógica)
  deleted_at?: string | null; // Data e hora da exclusão lógica
  deleted_by?: string | null; // ID do usuário que excluiu
  deleted_by_name?: string; // Nome do usuário que excluiu (para exibição)
  deleted_by_email?: string; // Email do usuário que excluiu (para exibição)
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
          .is('deleted_at', null) // SOFT DELETE: Apenas vagas não excluídas
          .order('created_at', { ascending: false });

        if (jobsError) {
          console.error('Erro ao buscar vagas:', jobsError);
          throw jobsError;
        }

        if (!jobs || jobs.length === 0) {
          return [];
        }

        // OTIMIZAÇÃO: Retornar vagas sem contagem inicial para carregamento rápido
        // A contagem de candidatos pode ser feita sob demanda ou em background
        const jobsWithApplicants = jobs.map((job) => ({
          ...job,
          applicants: 0, // Inicializar com 0, será atualizado sob demanda se necessário
          posted: new Date(job.created_at).toLocaleDateString('pt-BR')
        }));

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
      console.log('🔄 [useAllJobs] Iniciando busca de vagas...');
      const startTime = performance.now();
      
      try {
        // OTIMIZAÇÃO: Adicionar limite de segurança para evitar sobrecarga
        const { data: jobs, error } = await supabase
          .from('jobs')
          .select('*')
          .is('deleted_at', null) // SOFT DELETE: Apenas vagas não excluídas
          .order('created_at', { ascending: false })
          .limit(1000); // Limite de segurança

        if (error) {
          console.error('❌ [useAllJobs] Erro na query:', error);
          throw new Error(`Erro ao buscar vagas: ${error.message}`);
        }

        if (!jobs || jobs.length === 0) {
          console.log('⚠️ [useAllJobs] Nenhuma vaga encontrada');
          return [];
        }

        const endTime = performance.now();
        console.log(`✅ [useAllJobs] ${jobs.length} vagas carregadas em ${Math.round(endTime - startTime)}ms`);

        // OTIMIZAÇÃO: Retornar vagas sem contagem inicial para carregamento rápido
        // A contagem de candidatos será feita sob demanda quando necessário
        // Isso evita sobrecarregar o servidor com muitas requisições simultâneas
        const jobsWithApplicants: Job[] = jobs.map((job) => ({
          ...job,
          applicants: 0, // Inicializar com 0, será atualizado sob demanda
          hired_count: 0, // Inicializar com 0, será atualizado sob demanda
          posted: new Date(job.created_at).toLocaleDateString('pt-BR')
        }));

        return jobsWithApplicants;
      } catch (error: any) {
        console.error('💥 [useAllJobs] Erro crítico:', error);
        // Melhorar mensagem de erro para o usuário
        if (error?.message?.includes('Failed to fetch')) {
          throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
        }
        throw error;
      }
    },
    retry: 2, // Aumentar para 2 tentativas
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    staleTime: 3 * 60 * 1000, // 3 minutos
    refetchOnMount: false, // Não refazer ao montar para evitar delay
    refetchOnWindowFocus: false, // Não refazer ao focar para evitar delay
    refetchInterval: false, // Desabilitar refetch automático para evitar sobrecarga
    gcTime: 10 * 60 * 1000, // 10 minutos de cache
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
        .is('deleted_at', null) // SOFT DELETE: Apenas vagas não excluídas
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
    queryKey: ['pendingJobs', rhProfile?.user_id, rhProfile?.role],
    queryFn: async () => {
      console.log('🔍 [usePendingJobs] ===== INÍCIO DA BUSCA =====');
      console.log('🔍 [usePendingJobs] Perfil:', {
        role: rhProfile?.role,
        is_admin: rhProfile && 'is_admin' in rhProfile ? rhProfile.is_admin : 'N/A',
        user_id: rhProfile?.user_id,
        email: rhProfile?.email
      });

      let query = supabase
        .from('jobs')
        .select('*')
        .eq('approval_status', 'pending_approval')
        .is('deleted_at', null) // SOFT DELETE: Apenas vagas não excluídas
        .order('created_at', { ascending: false });

      // IMPORTANTE: Admin e Recrutador veem TODAS as vagas pendentes (sem filtros)
      // Apenas Gerente tem filtros por departamento/região
      if (rhProfile?.role === 'admin' || rhProfile?.role === 'recruiter') {
        console.log('✅ [usePendingJobs] Admin/Recrutador - Buscando TODAS as vagas pendentes (SEM FILTROS)');
        // Não aplicar nenhum filtro - admin/recrutador vê tudo
      } else if (rhProfile?.role === 'manager') {
        console.log('🔍 [usePendingJobs] Gerente - Aplicando filtros por permissões');
        // Filtro por departamento para gerentes
        if (rhProfile.assigned_departments && rhProfile.assigned_departments.length > 0) {
          console.log('🔍 [usePendingJobs] Gerente - Filtrando por departamentos:', rhProfile.assigned_departments);
          query = query.in('department', rhProfile.assigned_departments);
        }

        // Filtro por região (Estado/Cidade) para gerentes
        if (rhProfile.assigned_states && rhProfile.assigned_states.length > 0) {
          console.log('🔍 [usePendingJobs] Gerente - Filtrando por estados:', rhProfile.assigned_states);
          query = query.in('state', rhProfile.assigned_states);
        }

        if (rhProfile.assigned_cities && rhProfile.assigned_cities.length > 0) {
          console.log('🔍 [usePendingJobs] Gerente - Filtrando por cidades:', rhProfile.assigned_cities);
          query = query.in('city', rhProfile.assigned_cities);
        }
      } else {
        console.warn('⚠️ [usePendingJobs] Role desconhecida:', rhProfile?.role);
      }

      const { data, error } = await query;

      console.log('📊 [usePendingJobs] Resultado:', data?.length || 0, 'vagas encontradas para role:', rhProfile?.role);
      
      // DEBUG: Listar TODAS as vagas encontradas com detalhes
      if (data && data.length > 0) {
        console.log('📋 [usePendingJobs] Vagas pendentes encontradas:', data.map(j => ({
          id: j.id,
          title: j.title,
          department: j.department,
          city: j.city,
          state: j.state,
          approval_status: j.approval_status,
          created_at: j.created_at
        })));
      } else {
        console.log('⚠️ [usePendingJobs] Nenhuma vaga pendente encontrada!');
      }
      console.log('🔍 [usePendingJobs] ===== FIM DA BUSCA =====');

      if (error) {
        console.error('❌ [usePendingJobs] Erro ao buscar vagas pendentes:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!rhProfile,
    refetchOnMount: true, // Garantir que sempre busque dados atualizados
    refetchOnWindowFocus: true, // Atualizar quando a janela receber foco
    refetchInterval: 10000, // Atualizar a cada 10 segundos
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
    onSuccess: async (data) => {
      console.log('🔄 [useUpdateJob] ===== VAGA ATUALIZADA =====');
      console.log('🔄 [useUpdateJob] Dados da vaga atualizada:', {
        id: data?.id,
        title: data?.title,
        approval_status: data?.approval_status,
        status: data?.status,
        flow_status: data?.flow_status
      });
      
      // BUG FIX: Invalidar TODAS as queries relacionadas para atualização automática da UI
      await queryClient.invalidateQueries({ queryKey: ['jobs'] });
      await queryClient.invalidateQueries({ queryKey: ['allJobs'] });
      await queryClient.invalidateQueries({ queryKey: ['jobs-robust'] });
      
      // CORREÇÃO CRÍTICA: Invalidar pendingJobs para TODOS os usuários (admin, gerente, recrutador)
      console.log('🔄 [useUpdateJob] ===== INVALIDANDO PENDINGJOBS =====');
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const isPendingJobs = query.queryKey[0] === 'pendingJobs';
          if (isPendingJobs) {
            console.log('✅ [useUpdateJob] Invalidando pendingJobs para queryKey:', query.queryKey);
          }
          return isPendingJobs;
        },
        refetchType: 'all'
      });
      
      // EXTRA: Forçar refetch imediato de todas as queries pendingJobs
      const allQueries = queryClient.getQueryCache().getAll();
      const pendingJobsQueries = allQueries.filter(q => q.queryKey[0] === 'pendingJobs');
      console.log('🔍 [useUpdateJob] Encontradas', pendingJobsQueries.length, 'queries de pendingJobs para refetch');
      
      for (const query of pendingJobsQueries) {
        console.log('🔄 [useUpdateJob] Forçando refetch para:', query.queryKey);
        await queryClient.refetchQueries({ queryKey: query.queryKey, type: 'active' });
      }
      
      // CORREÇÃO CRÍTICA: Invalidar pendingJobs para TODOS os usuários (admin, gerente, recrutador)
      // Usar predicate para invalidar todas as variações da queryKey
      const invalidatedPending = queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0] === 'pendingJobs';
        }
      });
      
      console.log('✅ [useUpdateJob] Cache de pendingJobs invalidado!');
      console.log('🔄 [useUpdateJob] ===== FIM DA ATUALIZAÇÃO =====');
      
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      queryClient.invalidateQueries({ queryKey: ['candidatesByJob'] });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      // SOFT DELETE: Marcar como excluída em vez de deletar fisicamente
      const { error } = await supabase
        .from('jobs')
        .update({ 
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .is('deleted_at', null); // Apenas se ainda não estiver excluída

      if (error) throw error;
    },
    onSuccess: () => {
      // BUG FIX: Invalidar TODAS as queries relacionadas para atualização automática da UI
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['allJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs-robust'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      queryClient.invalidateQueries({ queryKey: ['candidatesByJob'] });
      queryClient.invalidateQueries({ queryKey: ['deletedJobs'] }); // Invalidar também a lista de excluídas
    },
  });
};

// Hook para restaurar vaga excluída (soft delete reverso)
export const useRestoreJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .rpc('restore_job', { job_id: id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['allJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs-robust'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      queryClient.invalidateQueries({ queryKey: ['deletedJobs'] });
    },
  });
};

// Hook para listar vagas excluídas (auditoria)
export const useDeletedJobs = () => {
  return useQuery({
    queryKey: ['deletedJobs'],
    queryFn: async () => {
      // Buscar vagas excluídas (incluindo campos de soft delete)
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (jobsError) throw jobsError;

      if (!jobs || jobs.length === 0) {
        return [];
      }

      // Buscar informações dos usuários que excluíram
      const userIds = [...new Set(jobs.map(j => j.deleted_by).filter(Boolean))];
      
      if (userIds.length === 0) {
        return jobs.map((job: any) => ({
          ...job,
          deleted_by_name: null,
          deleted_by_email: null,
        }));
      }

      const { data: users, error: usersError } = await supabase
        .from('rh_users')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      if (usersError) {
        console.warn('Erro ao buscar usuários que excluíram vagas:', usersError);
      }

      // Criar mapa de usuários
      const usersMap = new Map((users || []).map(u => [u.user_id, u]));

      // Mapear dados do usuário que excluiu e calcular dias até exclusão permanente
      return jobs.map((job: any) => {
        const user = job.deleted_by ? usersMap.get(job.deleted_by) : null;
        const deletedDate = job.deleted_at ? new Date(job.deleted_at) : null;
        const daysUntilPermanent = deletedDate 
          ? Math.max(0, 30 - Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)))
          : null;
        
        return {
          ...job,
          deleted_by_name: user?.full_name || null,
          deleted_by_email: user?.email || null,
          days_until_permanent_deletion: daysUntilPermanent,
          will_be_deleted_soon: daysUntilPermanent !== null && daysUntilPermanent <= 7,
        };
      });
    },
    staleTime: 30 * 1000, // 30 segundos
  });
};

// Hook para contar vagas que serão excluídas permanentemente (há mais de 30 dias)
export const useJobsToPermanentlyDelete = () => {
  return useQuery({
    queryKey: ['jobsToPermanentlyDelete'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('count_jobs_to_permanently_delete');

      if (error) throw error;
      return data || 0;
    },
    staleTime: 60 * 1000, // 1 minuto
  });
};

// Hook para executar limpeza permanente de vagas antigas
export const usePermanentlyDeleteOldJobs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .rpc('permanently_delete_old_jobs');

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobsToPermanentlyDelete'] });
      queryClient.invalidateQueries({ queryKey: ['allJobs'] });
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
        .is('deleted_at', null) // SOFT DELETE: Não permitir atualizar vagas excluídas
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
