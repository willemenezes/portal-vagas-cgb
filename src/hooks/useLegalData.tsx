import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CandidateLegalData, LegalDataFormValues } from '@/types/legal-validation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';
import { getRHByCandidate } from '@/utils/notifications';
import { Candidate } from './useCandidates';

// Interface para candidato com dados jurídicos
export interface ExtendedCandidate extends Candidate {
    job?: {
        title: string;
        city: string;
        state: string;
        department: string;
        type: string;
        workload: string;
        description: string;
    };
    candidate_legal_data?: {
        id: string;
        review_status: string;
        collected_at: string;
    }[];
}

// Hook para buscar dados jurídicos de um candidato
export const useLegalData = (candidateId: string | null) => {
    return useQuery({
        queryKey: ['legalData', candidateId],
        queryFn: async () => {
            if (!candidateId) return null;

            const { data, error } = await supabase
                .from('candidate_legal_data')
                .select('*, company_contract')
                .eq('candidate_id', candidateId)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            console.log('🔍 [useLegalData] Dados carregados:', {
                candidate_id: candidateId,
                has_data: !!data,
                company_contract: data?.company_contract,
                review_status: data?.review_status
            });

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
            console.log('🔍 [useSaveLegalData] Iniciando salvamento para candidato:', candidateId);

            // Validar dados obrigatórios
            if (!candidateId) {
                throw new Error('ID do candidato é obrigatório');
            }

            // Validar apenas campos realmente críticos (mais flexível)
            const criticalFields = {
                full_name: data.full_name?.trim(),
                desired_position: data.desired_position?.trim()
            };

            const missingCriticalFields = Object.entries(criticalFields)
                .filter(([key, value]) => !value || value === '')
                .map(([key]) => key);

            if (missingCriticalFields.length > 0) {
                console.error('❌ [useSaveLegalData] Campos críticos faltando:', missingCriticalFields);
                console.error('❌ [useSaveLegalData] Dados recebidos:', data);
                throw new Error(`Campos críticos não preenchidos: ${missingCriticalFields.join(', ')}`);
            }

            // Log de debug para campos opcionais vazios (sem bloquear)
            const optionalFields = {
                birth_date: data.birth_date,
                rg: data.rg?.trim(),
                cpf: data.cpf?.trim(),
                mother_name: data.mother_name?.trim(),
                birth_city: data.birth_city?.trim(),
                birth_state: data.birth_state?.trim()
            };

            const emptyOptionalFields = Object.entries(optionalFields)
                .filter(([key, value]) => !value || value === '')
                .map(([key]) => key);

            if (emptyOptionalFields.length > 0) {
                console.warn('⚠️ [useSaveLegalData] Campos opcionais vazios (não bloqueiam):', emptyOptionalFields);
            }

            // Verificar se já existe registro
            const { data: existing, error: existingError } = await supabase
                .from('candidate_legal_data')
                .select('id')
                .eq('candidate_id', candidateId)
                .single();

            if (existingError && existingError.code !== 'PGRST116') {
                console.error('❌ [useSaveLegalData] Erro ao verificar registro existente:', existingError);
            }

            console.log('📋 [useSaveLegalData] Registro existente:', existing ? 'SIM' : 'NÃO');

            // Obter o usuário atual (pode ser null para candidatos não autenticados)
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError) {
                console.error('❌ [useSaveLegalData] Erro ao obter usuário:', userError);
                // Não falhar se não conseguir obter usuário (para candidatos não autenticados)
            }

            console.log('👤 [useSaveLegalData] Usuário atual:', user?.id || 'NÃO AUTENTICADO');

            // Preparar o payload garantindo que todos os campos obrigatórios estejam presentes
            const payload = {
                candidate_id: candidateId,
                full_name: data.full_name,
                birth_date: data.birth_date,
                rg: data.rg,
                cpf: data.cpf,
                mother_name: data.mother_name,
                father_name: data.father_name || '',
                birth_city: data.birth_city,
                birth_state: data.birth_state,
                cnh: data.cnh || null,
                work_history: Array.isArray(data.work_history) ? data.work_history : [],
                is_former_employee: !!data.is_former_employee,
                former_employee_details: data.former_employee_details || '',
                is_pcd: !!data.is_pcd,
                pcd_details: data.pcd_details || '',
                desired_position: data.desired_position,
                company_contract: data.company_contract || null,
                responsible_name: data.responsible_name || null,
                collected_by: user?.id || null,
                review_status: 'pending' as const
            };

            console.log('📦 [useSaveLegalData] Payload preparado:', {
                candidate_id: payload.candidate_id,
                collected_by: payload.collected_by,
                review_status: payload.review_status,
                has_cpf: !!payload.cpf,
                has_full_name: !!payload.full_name,
                has_company_contract: !!payload.company_contract,
                work_history_count: payload.work_history.length
            });

            if (existing) {
                // Atualizar
                console.log('🔄 [useSaveLegalData] Atualizando registro existente...');
                const { data: updated, error } = await supabase
                    .from('candidate_legal_data')
                    .update(payload)
                    .eq('candidate_id', candidateId)
                    .select()
                    .single();

                if (error) {
                    console.error('❌ [useSaveLegalData] Erro ao atualizar:', error);
                    throw error;
                }

                console.log('✅ [useSaveLegalData] Registro atualizado com sucesso');
                return updated;
            } else {
                // Criar
                console.log('➕ [useSaveLegalData] Criando novo registro...');
                const { data: created, error } = await supabase
                    .from('candidate_legal_data')
                    .insert(payload)
                    .select()
                    .single();

                if (error) {
                    console.error('❌ [useSaveLegalData] Erro ao criar:', error);
                    console.error('❌ [useSaveLegalData] Payload que causou erro:', payload);
                    throw error;
                }

                console.log('✅ [useSaveLegalData] Registro criado com sucesso');
                return created;
            }
        },
        onSuccess: (data) => {
            // BUG FIX: Invalidar TODAS as queries relacionadas para atualização automática da UI
            queryClient.invalidateQueries({ queryKey: ['legalData', data.candidate_id] });
            queryClient.invalidateQueries({ queryKey: ['candidates'] });
            queryClient.invalidateQueries({ queryKey: ['candidatesByJob'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
            queryClient.invalidateQueries({ queryKey: ['candidatesForLegalValidation'] });
            queryClient.invalidateQueries({ queryKey: ['pendingLegalValidations'] });
        },
        onError: (error) => {
            console.error('Erro ao salvar dados jurídicos:', error);

            let errorMessage = 'Não foi possível salvar os dados jurídicos. Tente novamente.';

            // Personalizar mensagem de erro baseada no tipo de erro
            if (error.message?.includes('campos obrigatórios')) {
                errorMessage = 'Por favor, preencha todos os campos obrigatórios.';
            } else if (error.message?.includes('duplicate key')) {
                errorMessage = 'Já existem dados jurídicos para este candidato.';
            } else if (error.message?.includes('foreign key')) {
                errorMessage = 'Candidato não encontrado no sistema.';
            } else if (error.message?.includes('permission denied')) {
                errorMessage = 'Você não tem permissão para salvar estes dados.';
            } else if (error.message?.includes('violates check constraint')) {
                errorMessage = 'Alguns dados estão em formato inválido. Verifique os campos.';
            }

            toast({
                title: 'Erro ao salvar',
                description: errorMessage,
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
            // BUG FIX: Invalidar TODAS as queries relacionadas para atualização automática da UI
            queryClient.invalidateQueries({ queryKey: ['legalData', data.candidate_id] });
            queryClient.invalidateQueries({ queryKey: ['candidates'] });
            queryClient.invalidateQueries({ queryKey: ['candidatesByJob'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
            queryClient.invalidateQueries({ queryKey: ['candidatesForLegalValidation'] });
            queryClient.invalidateQueries({ queryKey: ['pendingLegalValidations'] });

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
                        legal_validation_comment,
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
            try {
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

                if (error) {
                    console.error('❌ [useCandidatesForLegalValidation] Erro na query:', error);
                    throw error;
                }

                console.log('✅ [useCandidatesForLegalValidation] Dados carregados:', data?.length || 0, 'candidatos');
                return data || [];
            } catch (error) {
                console.error('❌ [useCandidatesForLegalValidation] Erro geral:', error);
                throw error;
            }
        },
        retry: 2,
        staleTime: 30000, // 30 segundos
        refetchOnWindowFocus: false // Evita refetch desnecessário
    });
}; 