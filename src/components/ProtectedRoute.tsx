import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRHProfile } from '@/hooks/useRH';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
    requireAuth?: boolean;
    requireAdmin?: boolean;
    redirectTo?: string;
}

export const ProtectedRoute = ({
    children,
    requireAuth = true,
    requireAdmin = false,
    redirectTo = '/login'
}: ProtectedRouteProps) => {
    const { user, loading } = useAuth();
    const { data: rhProfile, isLoading: isLoadingProfile } = useRHProfile(user?.id);
    const navigate = useNavigate();
    const location = useLocation();

    const isAdmin = rhProfile?.role === 'admin';

    useEffect(() => {
        if (loading || isLoadingProfile) return;

        if (!requireAuth) return;

        if (requireAuth && !user) {
            const currentPath = location.pathname + location.search;
            navigate(redirectTo, {
                state: { from: currentPath },
                replace: true
            });
            return;
        }

        if (requireAdmin && !isAdmin) {
            navigate('/', { replace: true });
            return;
        }

    }, [user, loading, isLoadingProfile, requireAuth, requireAdmin, navigate, redirectTo, location, isAdmin]);

    // Mostrar loading enquanto verifica autenticação
    if (loading || isLoadingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cgb-primary mx-auto mb-4" />
                    <p className="text-cgb-primary">Verificando autenticação...</p>
                </div>
            </div>
        );
    }

    // Se não requer autenticação, renderizar sempre
    if (!requireAuth) {
        return <>{children}</>;
    }

    // Se requer autenticação e usuário não está logado, não renderizar
    if (requireAuth && !user) {
        return null;
    }

    // Se requer admin e usuário não é admin, não renderizar
    if (requireAdmin && !isAdmin) {
        return null;
    }

    // Renderizar o componente protegido
    return <>{children}</>;
}; 