import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
    const { user, loading, hasPermission } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (loading) return;

        if (!requireAuth) return;

        if (requireAuth && !user) {
            const currentPath = location.pathname + location.search;
            navigate(redirectTo, {
                state: { from: currentPath },
                replace: true
            });
            return;
        }

        if (requireAdmin && !hasPermission('admin')) {
            navigate('/', { replace: true });
            return;
        }

    }, [user, loading, requireAuth, requireAdmin, navigate, redirectTo, location, hasPermission]);

    // Mostrar loading enquanto verifica autenticação
    if (loading) {
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
    if (requireAdmin && !hasPermission('admin')) {
        return null;
    }

    // Renderizar o componente protegido
    return <>{children}</>;
}; 