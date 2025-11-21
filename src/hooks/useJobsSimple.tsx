import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface JobSimple {
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

export const useJobsSimple = () => {
    return useQuery({
        queryKey: ['jobs-simple'],
        queryFn: async (): Promise<JobSimple[]> => {
            console.log('🔍 Iniciando busca de vagas...');
            console.log('📡 URL Supabase:', supabase.supabaseUrl);

            try {
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
                    .eq('flow_status', 'ativa')
                    .is('deleted_at', null) // SOFT DELETE: Apenas vagas não excluídas
                    .order('created_at', { ascending: false });

                console.log('📊 Resultado da query:', { data, error });

                if (error) {
                    console.error('❌ Erro na query:', error);
                    throw new Error(`Erro do Supabase: ${error.message}`);
                }

                if (!data) {
                    console.log('⚠️ Nenhum dado retornado');
                    return [];
                }

                console.log(`✅ ${data.length} vagas encontradas`);

                // Mapear dados para o formato esperado
                const mappedData = data.map((job: any) => ({
                    ...job,
                    applicants: 0, // Temporariamente 0 para simplificar
                    posted: new Date(job.created_at).toLocaleDateString('pt-BR')
                }));

                console.log('🔄 Dados mapeados:', mappedData);
                return mappedData;

            } catch (error) {
                console.error('💥 Erro geral:', error);
                throw error;
            }
        },
        retry: 1,
        staleTime: 30 * 1000, // 30 segundos para debug
        refetchOnWindowFocus: false,
    });
}; 