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
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('status', 'active')
                .eq('approval_status', 'active')
                .or('flow_status.eq.ativa,flow_status.is.null')
                .order('created_at', { ascending: false });

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

            // Buscar contagem de candidatos para cada vaga
            const jobsWithApplicants = await Promise.all(
                data.map(async (job: any, index: number) => {
                    try {
                        const { count, error: countError } = await supabase
                            .from('candidates')
                            .select('id', { count: 'exact', head: true })
                            .eq('job_id', job.id);

                        if (countError) {
                            console.warn('Erro ao contar candidates para vaga', job.id, ':', countError);
                        }

                        return {
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
                            applicants: count || 0,
                            posted: job.created_at ? new Date(job.created_at).toLocaleDateString('pt-BR') : 'Data não disponível'
                        };
                    } catch (error) {
                        console.warn('Erro ao processar vaga', job.id, ':', error);
                        return {
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
                            applicants: 0,
                            posted: job.created_at ? new Date(job.created_at).toLocaleDateString('pt-BR') : 'Data não disponível'
                        };
                    }
                })
            );

            return jobsWithApplicants;
        },
        retry: 1, // Só tenta mais uma vez se falhar
        retryDelay: 2000, // 2 segundos
        staleTime: 30 * 1000, // 30 segundos (muito reduzido para pegar dados frescos)
        refetchOnWindowFocus: true, // Busca dados ao focar na janela
        refetchOnMount: true, // Refaz a busca ao navegar
        refetchInterval: 60 * 1000, // Refetch automático a cada 1 minuto
    });
}; 