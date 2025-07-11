import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRHProfile } from './useRH';
import { useToast } from './use-toast';

export interface JobRequest {
    id: string;
    title: string;
    department: string;
    city: string;
    state: string;
    type: string;
    description: string;
    requirements: string[];
    benefits: string[];
    workload: string;
    justification?: string; // Justificativa da criação da vaga
    status: 'pendente' | 'aprovado' | 'rejeitado';
    requested_by: string;
    requested_by_name?: string;
    notes?: string;
    approved_by?: string;
    approved_at?: string;
    job_created?: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateJobRequestData {
    title: string;
    department: string;
    city: string;
    state: string;
    type: string;
    description: string;
    requirements: string[];
    benefits: string[];
    workload: string;
    justification?: string; // Justificativa da criação da vaga
}

export const useJobRequests = () => {
    const { user } = useAuth();
    const { data: rhProfile } = useRHProfile(user?.id);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Buscar solicitações do usuário
    const {
        data: jobRequests = [],
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['job-requests', user?.id, rhProfile?.role],
        queryFn: async () => {
            if (!user) throw new Error('Usuário não autenticado');

            let query = supabase
                .from('job_requests')
                .select('*');

            // Aplicar filtros regionais baseados no perfil do usuário
            if (rhProfile && !rhProfile.is_admin) {
                if (rhProfile.role === 'solicitador') {
                    // Solicitadores veem apenas suas próprias solicitações
                    // E aplicam filtro regional se configurado
                    query = query.eq('requested_by', user.id.toString());
                } else if (rhProfile.role === 'manager' || rhProfile.role === 'gerente') {
                    // Gerentes veem todas as solicitações, mas filtradas por região
                    if (rhProfile.assigned_states && rhProfile.assigned_states.length > 0) {
                        query = query.in('state', rhProfile.assigned_states);
                    } else if (rhProfile.assigned_cities && rhProfile.assigned_cities.length > 0) {
                        query = query.in('city', rhProfile.assigned_cities);
                    }
                }
            }

            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) {
                console.error('Erro ao buscar job requests:', error);
                throw error;
            }

            return data as JobRequest[];
        },
        enabled: !!user && !!rhProfile,
    });

    // Criar nova solicitação
    const createJobRequest = useMutation({
        mutationFn: async (requestData: CreateJobRequestData) => {
            if (!user) throw new Error('Usuário não autenticado');

            // Buscar nome do usuário
            const { data: userData, error: userError } = await supabase
                .from('rh_users')
                .select('full_name')
                .eq('user_id', user.id)
                .single();

            if (userError) {
                console.error('Erro ao buscar dados do usuário:', userError);
                throw userError;
            }

            const { data, error } = await supabase
                .from('job_requests')
                .insert({
                    ...requestData,
                    requested_by: user.id.toString(),
                    requested_by_name: userData?.full_name || user.email || 'Usuário',
                })
                .select()
                .single();

            if (error) {
                console.error('Erro ao criar job request:', error);
                throw error;
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job-requests'] });
            toast({
                title: "Solicitação enviada!",
                description: "Sua solicitação de vaga foi enviada para aprovação da gerência.",
            });
        },
        onError: (error: any) => {
            console.error('Erro ao criar solicitação:', error);
            toast({
                title: "Erro ao enviar solicitação",
                description: error?.message || "Tente novamente mais tarde.",
                variant: "destructive",
            });
        },
    });

    // Atualizar status da solicitação (apenas para gerentes/admins)
    const updateJobRequestStatus = useMutation({
        mutationFn: async ({
            id,
            status,
            notes
        }: {
            id: string;
            status: 'aprovado' | 'rejeitado';
            notes?: string;
        }) => {
            if (!user) throw new Error('Usuário não autenticado');

            // Buscar nome do aprovador
            const { data: userData, error: userError } = await supabase
                .from('rh_users')
                .select('full_name')
                .eq('user_id', user.id)
                .single();

            if (userError) {
                console.error('Erro ao buscar dados do aprovador:', userError);
                throw userError;
            }

            const { data, error } = await supabase
                .from('job_requests')
                .update({
                    status,
                    notes,
                    approved_by: userData?.full_name || user.email || 'Aprovador',
                    approved_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Erro ao atualizar status:', error);
                throw error;
            }

            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['job-requests'] });
            toast({
                title: "Status atualizado!",
                description: `Solicitação ${data.status === 'aprovado' ? 'aprovada' : 'rejeitada'} com sucesso.`,
            });
        },
        onError: (error: any) => {
            console.error('Erro ao atualizar status:', error);
            toast({
                title: "Erro ao atualizar status",
                description: error?.message || "Tente novamente mais tarde.",
                variant: "destructive",
            });
        },
    });

    // Criar vaga a partir de solicitação aprovada
    const createJobFromRequest = useMutation({
        mutationFn: async (requestId: string) => {
            if (!user) throw new Error('Usuário não autenticado');

            const { data, error } = await supabase.rpc('create_job_from_request', {
                request_id: requestId.toString()
            });

            if (error) {
                console.error('Erro ao criar vaga:', error);
                throw error;
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job-requests'] });
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            toast({
                title: "Vaga criada!",
                description: "A vaga foi criada com sucesso e está ativa para candidaturas.",
            });
        },
        onError: (error: any) => {
            console.error('Erro ao criar vaga:', error);
            toast({
                title: "Erro ao criar vaga",
                description: error?.message || "Tente novamente mais tarde.",
                variant: "destructive",
            });
        },
    });

    // Aprovar e criar vaga diretamente
    const approveAndCreateJob = useMutation({
        mutationFn: async ({
            requestId,
            notes
        }: {
            requestId: string;
            notes?: string;
        }) => {
            if (!user) throw new Error('Usuário não autenticado');

            const { data, error } = await supabase.rpc('approve_and_create_job', {
                request_id: requestId.toString(),
                approval_notes: notes || null
            });

            if (error) {
                console.error('Erro ao aprovar e criar vaga:', error);
                throw error;
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job-requests'] });
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            toast({
                title: "Vaga aprovada e criada!",
                description: "A solicitação foi aprovada e a vaga foi criada diretamente.",
            });
        },
        onError: (error: any) => {
            console.error('Erro ao aprovar e criar vaga:', error);
            toast({
                title: "Erro ao aprovar e criar vaga",
                description: error?.message || "Tente novamente mais tarde.",
                variant: "destructive",
            });
        },
    });

    // Excluir solicitação de vaga
    const deleteJobRequest = useMutation({
        mutationFn: async (requestId: string) => {
            if (!user) throw new Error('Usuário não autenticado');

            const { error } = await supabase
                .from('job_requests')
                .delete()
                .eq('id', requestId);

            if (error) {
                console.error('Erro ao excluir solicitação:', error);
                throw error;
            }

            return requestId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job-requests'] });
            toast({
                title: "Solicitação excluída!",
                description: "A solicitação foi removida permanentemente.",
            });
        },
        onError: (error: any) => {
            console.error('Erro ao excluir solicitação:', error);
            toast({
                title: "Erro ao excluir solicitação",
                description: error?.message || "Tente novamente mais tarde.",
                variant: "destructive",
            });
        },
    });

    // Estatísticas
    const stats = {
        total: jobRequests.length,
        pendentes: jobRequests.filter(req => req.status === 'pendente').length,
        aprovadas: jobRequests.filter(req => req.status === 'aprovado').length,
        rejeitadas: jobRequests.filter(req => req.status === 'rejeitado').length,
    };

    return {
        jobRequests,
        stats,
        isLoading,
        error,
        refetch,
        createJobRequest,
        updateJobRequestStatus,
        createJobFromRequest,
        approveAndCreateJob,
        deleteJobRequest,
        isCreating: createJobRequest.isPending,
        isUpdating: updateJobRequestStatus.isPending,
        isDeleting: deleteJobRequest.isPending,
    };
};

export default useJobRequests; 