import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { FunctionsHttpError } from '@supabase/supabase-js';

export interface RHUser {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    assigned_states?: string[] | null;
    assigned_cities?: string[] | null;
    assigned_departments?: string[] | null;
    role: 'admin' | 'recruiter' | 'manager' | 'juridico' | 'solicitador';
    created_at: string;
    updated_at: string;
}

export type NewRHUser = Omit<RHUser, 'id' | 'created_at' | 'updated_at' | 'is_admin'> & {
    user_id?: string;
    password?: string;
};

/**
 * Hook para buscar todos os usuários de RH.
 * A RLS garante que isso só retorne dados se o usuário for um admin.
 */
export const useRHUsers = () => {
    return useQuery<RHUser[], Error>({
        queryKey: ['rh_users'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('rh_users')
                .select('*')
                .order('full_name', { ascending: true });

            if (error) throw new Error(error.message);
            return data || [];
        },
    });
};

/**
 * Hook para buscar um perfil de RH específico pelo user_id da autenticação.
 */
export const useRHProfile = (userId?: string) => {
    return useQuery<RHUser | null>({
        queryKey: ['rhProfile', userId],
        queryFn: async () => {
            if (!userId) return null;
            const { data, error } = await supabase
                .from('rh_users')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error("Erro ao buscar perfil RH:", error);
                throw error;
            }
            return data;
        },
        enabled: !!userId,
    });
};

/**
 * Hook para criar um novo usuário de RH.
 * A RLS garante que isso só funcione se o usuário for um admin.
 */
export const useCreateRHUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newUser: NewRHUser & { password?: string }) => {
            const { email, password, full_name, role, assigned_states, assigned_cities } = newUser;

            const { data, error } = await supabase.functions.invoke('create-user-direct', {
                body: { email, password, fullName: full_name, role, assignedStates: assigned_states, assignedCities: assigned_cities },
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            return {
                email: data.user.email,
                fullName: data.user.full_name,
                password: data.generatedPassword
            };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['rh_users'] });
        },
        onError: (error: Error) => {
            console.error('❌ Erro detalhado na mutation createRHUser:', error);
        }
    });
};

/**
 * Hook para atualizar um usuário de RH.
 */
export const useUpdateRHUser = () => {
    const queryClient = useQueryClient();
    return useMutation<RHUser, Error, Partial<RHUser> & { id: string }>({
        mutationFn: async (userToUpdate) => {
            const { id, ...updateData } = userToUpdate;
            const { data, error } = await supabase
                .from('rh_users')
                .update(updateData)
                .eq('id', id)
                .select();

            if (error) throw new Error(error.message);
            if (!data || data.length === 0) throw new Error("Nenhum usuário encontrado para atualizar.");
            return data[0];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rh_users'] });
            queryClient.invalidateQueries({ queryKey: ['rh_profile'] });
        },
    });
};

/**
 * Hook para deletar um usuário de RH.
 */
export const useDeleteRHUser = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('rh_users')
                .delete()
                .eq('id', id);

            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rh_users'] });
        },
    });
};

/**
 * Hook para resetar a senha de um usuário de RH.
 * Apenas admins podem usar esta funcionalidade.
 */
export const useResetRHUserPassword = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, newPassword }: { userId: string, newPassword: string }) => {
            const { data, error } = await supabase.functions.invoke('reset-user-password', {
                body: { userId, newPassword },
            });

            if (error) {
                if (error instanceof FunctionsHttpError) {
                    const errorJson = await error.context.json();
                    if (errorJson.error) {
                        throw new Error(errorJson.error);
                    }
                }
                throw new Error(error.message);
            }

            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['rh_users'] });
        },
        onError: (error: Error) => {
            console.error('❌ Erro no hook useResetRHUserPassword:', error);
        }
    });
}; 