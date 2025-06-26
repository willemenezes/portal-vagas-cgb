import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Job {
  id: string;
  title: string;
  department: string;
  city: string;
  state: string;
  type: 'CLT' | 'Estágio' | 'Aprendiz' | 'Terceirizado';
  description: string;
  requirements: string[];
  benefits: string[];
  workload: string;
  status: 'draft' | 'active' | 'closed';
  created_at: string;
  updated_at: string;
  applicants?: number;
  posted?: string;
}

export const useJobs = () => {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      try {
        // Primeiro buscar as vagas ativas
        const { data: jobs, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .eq('status', 'active')
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

        return jobsWithApplicants;
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

              return {
                ...job,
                applicants: count || 0,
                posted: new Date(job.created_at).toLocaleDateString('pt-BR')
              };
            } catch (error) {
              return {
                ...job,
                applicants: 0,
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
      const { data, error } = await supabase
        .from('jobs')
        .update(job)
        .eq('id', id)
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
