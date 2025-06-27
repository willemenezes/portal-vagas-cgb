import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CandidateNote } from './useCandidateNotes';

export const useAllRejectionNotes = () => {
    return useQuery<CandidateNote[]>({
        queryKey: ['allRejectionNotes'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('candidate_notes')
                .select('*')
                .eq('activity_type', 'Reprovação');

            if (error) {
                console.error("Erro ao buscar notas de reprovação:", error);
                throw new Error(error.message);
            }

            return data || [];
        },
        staleTime: 5 * 60 * 1000, // Cache de 5 minutos
    });
}; 