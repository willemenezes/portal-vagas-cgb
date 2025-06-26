import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CandidateNote {
    id: string;
    candidate_id: string;
    author_id: string;
    note: string;
    activity_type: string;
    created_at: string;
    author: {
        full_name?: string;
        email?: string;
    } | null;
}

export type NewCandidateNote = Omit<CandidateNote, 'id' | 'created_at' | 'author'>;

// Hook para buscar notas de um candidato
export const useCandidateNotes = (candidateId: string | null) => {
    return useQuery<CandidateNote[]>({
        queryKey: ['candidateNotes', candidateId],
        queryFn: async () => {
            if (!candidateId) return [];

            // 1. Buscar as notas primeiro
            const { data: notes, error: notesError } = await supabase
                .from('candidate_notes')
                .select(`*`)
                .eq('candidate_id', candidateId)
                .order('created_at', { ascending: false });

            if (notesError) throw notesError;
            if (!notes || notes.length === 0) return [];

            // 2. Pegar os IDs únicos dos autores
            const authorIds = [...new Set(notes.map(note => note.author_id).filter(id => id))];

            if (authorIds.length === 0) {
                return notes.map(note => ({ ...note, author: null }));
            }

            // 3. Buscar os detalhes dos autores
            const { data: authors, error: authorsError } = await supabase
                .from('rh_users')
                .select('user_id, full_name, email')
                .in('user_id', authorIds);

            if (authorsError) {
                console.error("Erro ao buscar autores das notas:", authorsError);
                // Retorna as notas mesmo que os autores não sejam encontrados
                return notes.map(note => ({ ...note, author: null }));
            }

            // 4. Mapear autores por ID para busca rápida
            const authorMap = new Map(authors.map(author => [author.user_id, author]));

            // 5. Combinar as notas com os autores
            const notesWithAuthors = notes.map(note => ({
                ...note,
                author: authorMap.get(note.author_id) || null
            }));

            return notesWithAuthors as CandidateNote[];
        },
        enabled: !!candidateId,
    });
};

// Hook para adicionar uma nova nota
export const useCreateCandidateNote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newNote: NewCandidateNote) => {
            const { data, error } = await supabase
                .from('candidate_notes')
                .insert([newNote])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['candidateNotes', data.candidate_id] });
        },
    });
}; 