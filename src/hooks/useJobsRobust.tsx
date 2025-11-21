import { useQuery } from '@tanstack/react-query';
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
    flow_status?: 'ativa' | 'concluida' | 'congelada';
}

export const useJobsRobust = () => {
    return useQuery({
        queryKey: ['jobs-robust'],
        queryFn: async (): Promise<Job[]> => {
            // Buscar vagas ativas e aprovadas COM flow_status = 'ativa' OU null (recém-criadas)
            // OTIMIZAÇÃO: Selecionar apenas campos necessários para homepage
            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    id,
                    title,
                    department,
                    city,
                    state,
                    type,
                    description,
                    requirements,
                    benefits,
                    workload,
                    status,
                    created_at,
                    updated_at,
                    flow_status
                `)
                .eq('status', 'active')
                .eq('approval_status', 'active')
                .or('flow_status.eq.ativa,flow_status.is.null')
                .is('deleted_at', null) // SOFT DELETE: Apenas vagas não excluídas
                .order('created_at', { ascending: false })
                .limit(500); // Limite de segurança para homepage

            if (error) {
                if (error.code === 'PGRST116') {
                    throw new Error('Nenhuma vaga encontrada no momento.');
                } else if (error.code === '42501') {
                    throw new Error('Problema de permissão no banco de dados.');
                } else if (error.message?.includes('connection')) {
                    throw new Error('Problema de conexão com o banco de dados.');
                } else {
                    throw new Error(`Erro do banco: ${error.message || 'Erro desconhecido'}`);
                }
            }

            if (!data || !Array.isArray(data)) return [];

            // OTIMIZAÇÃO: Retornar vagas sem contagem inicial para carregamento rápido
            // A contagem de candidatos será feita sob demanda quando necessário
            const jobsWithApplicants = data.map((job: any, index: number) => ({
                id: job.id || `temp-${index}`,
                title: job.title || 'Título não disponível',
                department: job.department || 'Departamento não informado',
                city: job.city || 'Cidade não informada',
                state: job.state || 'Estado não informado',
                type: job.type || 'CLT',
                description: job.description || 'Descrição não disponível',
                requirements: Array.isArray(job.requirements) ? job.requirements : [],
                benefits: Array.isArray(job.benefits) ? job.benefits : [],
                workload: job.workload || 'Não informado',
                status: job.status || 'active',
                created_at: job.created_at || new Date().toISOString(),
                updated_at: job.updated_at || new Date().toISOString(),
                applicants: 0, // Inicializar com 0, será atualizado sob demanda
                posted: job.created_at ? new Date(job.created_at).toLocaleDateString('pt-BR') : 'Data não disponível',
                flow_status: job.flow_status || null
            }));

            return jobsWithApplicants;
        },
        retry: 1, // Só tenta mais uma vez se falhar
        retryDelay: 1000, // 1 segundo
        staleTime: 5 * 60 * 1000, // 5 minutos
        refetchOnWindowFocus: false, // Não refazer ao focar para evitar delay
        refetchOnMount: false, // Não refazer ao montar para carregamento rápido
        refetchInterval: false, // Desabilitar refetch automático
        gcTime: 10 * 60 * 1000 // 10 minutos de cache
    });
}; 