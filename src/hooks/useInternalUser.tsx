import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useRHProfile } from './useRH';

/**
 * Hook para gerenciar cookies de usuários internos
 * Usado para filtrar acessos internos do analytics
 */
export const useInternalUser = () => {
    const { user } = useAuth();
    const { data: rhProfile } = useRHProfile(user?.id);

    useEffect(() => {
        // Verificar se é usuário interno (RH)
        if (user && rhProfile) {
            // Definir cookie para usuário interno
            document.cookie = "internal_user=true; path=/; max-age=31536000; SameSite=Lax";
            console.log('🍪 [InternalUser] Cookie interno definido para:', rhProfile.email);
        } else if (user && !rhProfile) {
            // Usuário autenticado mas sem perfil RH = usuário externo
            // Remover cookie interno se existir
            document.cookie = "internal_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            console.log('🍪 [InternalUser] Cookie interno removido para usuário externo');
        } else {
            // Usuário não autenticado = usuário externo
            document.cookie = "internal_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
    }, [user, rhProfile]);

    // Função para verificar se é usuário interno
    const isInternalUser = () => {
        return document.cookie.includes('internal_user=true');
    };

    return {
        isInternalUser,
        isRHUser: !!rhProfile,
        userRole: rhProfile?.role
    };
};
