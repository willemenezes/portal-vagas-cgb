import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type SelectionStatus } from '@/lib/constants';

export interface CandidateByJob {
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
    legal_status?: 'pendente' | 'aprovado' | 'aprovado_com_restricao' | 'reprovado';
    tj_validation_started_at?: string | null;
    resume_file_url?: string | null;
    resume_file_name?: string | null;
    cnh?: string | null;
    vehicle?: string | null;
    workedAtCGB?: string | null;
    pcd?: string | null;
    travel?: string | null;
    age?: string | null;
    whatsapp?: string | null;
    desiredJob?: string | null;
    avatar_url?: string | null;
    job?: {
        title: string;
        city: string;
        state: string;
    };
}

/**
 * Hook otimizado para buscar candidatos de uma vaga específica.
 * 
 * CORREÇÃO DO BUG: Anteriormente, todos os candidatos eram buscados e filtrados
 * localmente, causando limite de 1000 registros e contagens incorretas.
 * 
 * Agora fazemos a consulta diretamente no Supabase com filtro server-side.
 * 
 * @param jobId - ID da vaga
 * @returns Query com os candidatos da vaga
 */
export const useCandidatesByJob = (jobId: string | null) => {
    return useQuery({
        queryKey: ['candidatesByJob', jobId],
        queryFn: async () => {
            if (!jobId) return [];

            // BUG FIX: Buscar apenas candidatos da vaga específica (filtro server-side)
            const { data, error } = await supabase
                .from('candidates')
                .select(`
          *,
          job:jobs(title, city, state)
        `)
                .eq('job_id', jobId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error(`Erro ao buscar candidatos da vaga ${jobId}:`, error);
                throw error;
            }

            return (data || []) as CandidateByJob[];
        },
        enabled: !!jobId,
        staleTime: 2 * 60 * 1000, // 2 minutos
        refetchOnWindowFocus: true,
    });
};

/**
 * Hook para contar candidatos de uma vaga por status.
 * 
 * CORREÇÃO DO BUG: Usa count('exact') do Supabase ao invés de buscar
 * todos os registros e contar localmente.
 * 
 * @param jobId - ID da vaga
 * @param status - Status específico (opcional)
 * @returns Query com a contagem exata
 */
export const useCandidatesCountByJob = (jobId: string | null, status?: string) => {
    return useQuery({
        queryKey: ['candidatesCountByJob', jobId, status],
        queryFn: async () => {
            if (!jobId) return 0;

            let query = supabase
                .from('candidates')
                .select('id', { count: 'exact', head: true })
                .eq('job_id', jobId);

            if (status) {
                query = query.eq('status', status);
            }

            const { count, error } = await query;

            if (error) {
                console.error(`Erro ao contar candidatos da vaga ${jobId}:`, error);
                throw error;
            }

            return count || 0;
        },
        enabled: !!jobId,
        staleTime: 2 * 60 * 1000,
    });
};

/**
 * Hook para buscar estatísticas de candidatos por vaga (agregado).
 * 
 * Retorna contagens por status de forma otimizada usando RPC ou múltiplas
 * queries com count('exact').
 * 
 * @param jobId - ID da vaga
 * @returns Query com estatísticas agregadas
 */
export const useCandidatesStatsByJob = (jobId: string | null) => {
    return useQuery({
        queryKey: ['candidatesStatsByJob', jobId],
        queryFn: async () => {
            if (!jobId) {
                return {
                    total: 0,
                    byStatus: {} as Record<string, number>
                };
            }

            // Buscar contagem total
            const { count: total, error: totalError } = await supabase
                .from('candidates')
                .select('id', { count: 'exact', head: true })
                .eq('job_id', jobId);

            if (totalError) {
                console.error(`Erro ao contar total de candidatos da vaga ${jobId}:`, totalError);
                throw totalError;
            }

            // Buscar candidatos com apenas o campo status para agregar
            const { data: statusData, error: statusError } = await supabase
                .from('candidates')
                .select('status')
                .eq('job_id', jobId);

            if (statusError) {
                console.error(`Erro ao buscar status dos candidatos da vaga ${jobId}:`, statusError);
                throw statusError;
            }

            // Agregar por status
            const byStatus = (statusData || []).reduce((acc, { status }) => {
                if (status) {
                    acc[status] = (acc[status] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);

            return {
                total: total || 0,
                byStatus
            };
        },
        enabled: !!jobId,
        staleTime: 2 * 60 * 1000,
    });
};

