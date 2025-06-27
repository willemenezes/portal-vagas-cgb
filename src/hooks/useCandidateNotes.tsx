import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CandidateNote {
    id: string;
    candidate_id: string;
    author_id: string;
    note: string;
    activity_type: string;
    created_at: string;
    author?: {
        user_id: string;
        full_name: string;
        email: string;
    } | null;
}

export interface LegalValidation {
    id: string;
    candidate_id: string;
    validator_id: string;
    status: 'aprovado' | 'reprovado' | 'aprovado_com_restricao';
    comments?: string;
    created_at: string;
    validator?: {
        user_id: string;
        full_name: string;
        email: string;
    } | null;
}

export interface HistoryItem {
    id: string;
    type: 'note' | 'legal_validation';
    candidate_id: string;
    author_id: string;
    content: string;
    activity_type: string;
    created_at: string;
    author?: {
        user_id: string;
        full_name: string;
        email: string;
    } | null;
    legal_status?: 'aprovado' | 'reprovado' | 'aprovado_com_restricao';
    comments?: string;
}

export interface NewCandidateNote {
    candidate_id: string;
    author_id: string;
    note: string;
    activity_type: string;
}

// Hook para buscar validações legais de um candidato
export const useCandidateLegalValidations = (candidateId: string | null) => {
    return useQuery<LegalValidation[]>({
        queryKey: ['candidateLegalValidations', candidateId],
        queryFn: async () => {
            if (!candidateId) return [];

            // 1. Buscar as validações legais
            const { data: validations, error: validationsError } = await supabase
                .from('candidate_legal_validations')
                .select('*')
                .eq('candidate_id', candidateId)
                .order('created_at', { ascending: false });

            if (validationsError) throw validationsError;
            if (!validations || validations.length === 0) return [];

            // 2. Pegar os IDs únicos dos validadores
            const validatorIds = [...new Set(validations.map(validation => validation.validator_id).filter(id => id))];

            if (validatorIds.length === 0) {
                return validations.map(validation => ({ ...validation, validator: null }));
            }

            // 3. Buscar os detalhes dos validadores
            const { data: validators, error: validatorsError } = await supabase
                .from('rh_users')
                .select('user_id, full_name, email')
                .in('user_id', validatorIds);

            if (validatorsError) {
                console.error("Erro ao buscar validadores:", validatorsError);
                return validations.map(validation => ({ ...validation, validator: null }));
            }

            // 4. Mapear validadores por ID para busca rápida
            const validatorMap = new Map(validators.map(validator => [validator.user_id, validator]));

            // 5. Combinar as validações com os validadores
            const validationsWithValidators = validations.map(validation => ({
                ...validation,
                validator: validatorMap.get(validation.validator_id) || null
            }));

            return validationsWithValidators as LegalValidation[];
        },
        enabled: !!candidateId,
    });
};

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

// Hook combinado para buscar histórico completo (notas + validações legais)
export const useCandidateHistory = (candidateId: string | null) => {
    return useQuery<HistoryItem[]>({
        queryKey: ['candidateHistory', candidateId],
        queryFn: async () => {
            if (!candidateId) return [];

            // Buscar notas e validações em paralelo
            const [notesResponse, validationsResponse] = await Promise.all([
                supabase
                    .from('candidate_notes')
                    .select('*')
                    .eq('candidate_id', candidateId),
                supabase
                    .from('candidate_legal_validations')
                    .select('*')
                    .eq('candidate_id', candidateId)
            ]);

            if (notesResponse.error) throw notesResponse.error;
            if (validationsResponse.error) throw validationsResponse.error;

            const notes = notesResponse.data || [];
            const validations = validationsResponse.data || [];

            // Pegar todos os IDs únicos de autores/validadores
            const allUserIds = [
                ...new Set([
                    ...notes.map(note => note.author_id).filter(id => id),
                    ...validations.map(validation => validation.validator_id).filter(id => id)
                ])
            ];

            let userMap = new Map();
            if (allUserIds.length > 0) {
                const { data: users, error: usersError } = await supabase
                    .from('rh_users')
                    .select('user_id, full_name, email')
                    .in('user_id', allUserIds);

                if (!usersError && users) {
                    userMap = new Map(users.map(user => [user.user_id, user]));
                }
            }

            // Converter notas para HistoryItem
            const noteItems: HistoryItem[] = notes.map(note => ({
                id: note.id,
                type: 'note' as const,
                candidate_id: note.candidate_id,
                author_id: note.author_id,
                content: note.note,
                activity_type: note.activity_type,
                created_at: note.created_at,
                author: userMap.get(note.author_id) || null
            }));

            // Converter validações legais para HistoryItem
            const validationItems: HistoryItem[] = validations.map(validation => {
                let content = '';
                switch (validation.status) {
                    case 'aprovado':
                        content = 'Candidato aprovado na validação jurídica';
                        break;
                    case 'reprovado':
                        content = `Candidato reprovado na validação jurídica${validation.comments ? `: ${validation.comments}` : ''}`;
                        break;
                    case 'aprovado_com_restricao':
                        content = `Candidato aprovado com restrição na validação jurídica${validation.comments ? `: ${validation.comments}` : ''}`;
                        break;
                }

                return {
                    id: validation.id,
                    type: 'legal_validation' as const,
                    candidate_id: validation.candidate_id,
                    author_id: validation.validator_id,
                    content,
                    activity_type: 'Validação Legal',
                    created_at: validation.created_at,
                    author: userMap.get(validation.validator_id) || null,
                    legal_status: validation.status,
                    comments: validation.comments
                };
            });

            // Combinar e ordenar por data (mais recente primeiro)
            const allItems = [...noteItems, ...validationItems];
            allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            return allItems;
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
            queryClient.invalidateQueries({ queryKey: ['candidateHistory', data.candidate_id] });
        },
    });
}; 