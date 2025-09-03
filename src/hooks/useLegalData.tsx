import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CandidateLegalData, LegalDataFormValues } from '@/types/legal-validation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';
import { getRHByCandidate } from '@/utils/notifications';

// Hook para buscar dados jurídicos de um candidato
export const useLegalData = (candidateId: string | null) => {
    return useQuery({
        queryKey: ['legalData', candidateId],
        queryFn: async () => {
            if (!candidateId) return null;

            const { data, error } = await supabase
                .from('candidate_legal_data')
                .select('*')
                .eq('candidate_id', candidateId)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            return data as CandidateLegalData | null;
        },
        enabled: !!candidateId,
    });
};

// Hook para criar ou atualizar dados jurídicos
export const useSaveLegalData = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ candidateId, data }: { candidateId: string; data: LegalDataFormValues }) => {
            // Verificar se já existe registro
            const { data: existing } = await supabase
                .from('candidate_legal_data')
                .select('id')
                .eq('candidate_id', candidateId)
                .single();

            // Obter o usuário atual (pode ser null para candidatos não autenticados)
            const { data: { user } } = await supabase.auth.getUser();
            
            const payload = {
                ...data,
                candidate_id: candidateId,
                collected_by: user?.id || null, // Permitir null para candidatos não autenticados
                review_status: 'pending'
            };

            if (existing) {
                // Atualizar
                const { data: updated, error } = await supabase
                    .from('candidate_legal_data')
                    .update(payload)
                    .eq('candidate_id', candidateId)
                    .select()
                    .single();

                if (error) throw error;
                return updated;
            } else {
                // Criar
                const { data: created, error } = await supabase
                    .from('candidate_legal_data')
                    .insert(payload)
                    .select()
                    .single();

                if (error) throw error;
                return created;
            }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['legalData', data.candidate_id] });
            queryClient.invalidateQueries({ queryKey: ['candidates'] });
        },
        onError: (error) => {
            console.error('Erro ao salvar dados jurídicos:', error);
            toast({
                title: 'Erro ao salvar',
                description: 'Não foi possível salvar os dados jurídicos. Tente novamente.',
                variant: 'destructive'
            });
        }
    });
};

// Hook para aprovar/rejeitar validação jurídica
export const useReviewLegalData = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { sendNotification } = useNotifications();

    return useMutation({
        mutationFn: async ({
            candidateId,
            status,
            notes
        }: {
            candidateId: string;
            status: 'approved' | 'rejected' | 'request_changes';
            notes?: string;
        }) => {
            const { data, error } = await supabase
                .from('candidate_legal_data')
                .update({
                    review_status: status,
                    review_notes: notes,
                    reviewed_by: (await supabase.auth.getUser()).data.user?.id,
                    reviewed_at: new Date().toISOString()
                })
                .eq('candidate_id', candidateId)
                .select()
                .single();

            if (error) throw error;

            // Se aprovado, NÃO atualizar o status do candidato para que ele permaneça na mesma fase do Kanban
            /*
            if (status === 'approved') {
                const { error: candidateError } = await supabase
                    .from('candidates')
                    .update({ status: 'Aprovado TJ' })
                    .eq('id', candidateId);

                if (candidateError) throw candidateError;
            }
            */

            return data;
        },
        onSuccess: async (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['legalData', data.candidate_id] });
            queryClient.invalidateQueries({ queryKey: ['candidates'] });

            toast({
                title: 'Revisão salva',
                description: 'A validação jurídica foi atualizada com sucesso.'
            });

            // Enviar notificação para RH sobre resultado da validação
            try {
                const rhUsers = await getRHByCandidate(data.candidate_id);
                if (rhUsers.length > 0) {
                    // Buscar dados do candidato para o template
                    const { data: candidate } = await supabase
                        .from('candidates')
                        .select(`
                            *,
                            job:jobs(title, department, city, state)
                        `)
                        .eq('id', data.candidate_id)
                        .single();

                    if (candidate) {
                        const notificationType = variables.status === 'approved' 
                            ? 'legal_validation_approved' 
                            : 'legal_validation_rejected';

                        await sendNotification({
                            type: notificationType,
                            recipients: rhUsers,
                            data: {
                                candidateName: candidate.name,
                                candidateEmail: candidate.email,
                                candidateId: candidate.id,
                                jobTitle: candidate.job?.title || candidate.desiredJob,
                                department: candidate.job?.department,
                                city: candidate.city || candidate.job?.city,
                                state: candidate.state || candidate.job?.state,
                                notes: variables.notes,
                                status: variables.status,
                                actionDate: new Date().toLocaleString('pt-BR')
                            },
                            silent: true
                        });
                    }
                }
            } catch (error) {
                console.error('Erro ao enviar notificação de validação jurídica:', error);
            }
        },
        onError: (error) => {
            console.error('Erro ao revisar dados jurídicos:', error);
            toast({
                title: 'Erro ao revisar',
                description: 'Não foi possível salvar a revisão. Tente novamente.',
                variant: 'destructive'
            });
        }
    });
};

// Hook para buscar todos os candidatos pendentes de validação jurídica
export const usePendingLegalValidations = () => {
    return useQuery({
        queryKey: ['pendingLegalValidations'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('candidates')
                .select(`
                    *,
           jobs (title, department),
                    candidate_legal_data (
                        id,
                        review_status,
            collected_at,
            reviewed_at
                    )
                `)
                .eq('status', 'Validação TJ');
            if (error) throw error;
            return data || [];
        }
    });
};

// Hook para buscar as validações realizadas pelo usuário jurídico logado
export const useMyApprovedValidations = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['myApprovedValidations', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('candidate_legal_data')
                .select(`
                    id,
                    reviewed_at,
                    review_status,
                    candidate:candidates (
                        id,
                        name,
                        email,
                        job:jobs (
                            title,
                            city,
                            state
                        )
                    )
                `)
                .eq('reviewed_by', user.id)
                .in('review_status', ['approved', 'rejected', 'request_changes'])
                .order('reviewed_at', { ascending: false });

            if (error) {
                console.error("Error fetching my approved validations:", error);
                throw error;
            }

            return data || [];
        },
        enabled: !!user,
    });
};

// Hook para buscar candidatos em validação com dados completos
export const useCandidatesForLegalValidation = () => {
    return useQuery<ExtendedCandidate[], Error>({
        queryKey: ['candidatesForLegalValidation'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('candidates')
                .select(`
                    *,
                    job:jobs (
                        title,
                        city,
                        state,
                        department,
                        type,
                        workload,
                        description
                    ),
                    candidate_legal_data (
                        id,
                        review_status,
                        collected_at
                    )
                `)
                .eq('status', 'Validação TJ')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];
        }
    });
}; 