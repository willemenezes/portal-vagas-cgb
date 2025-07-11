import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRHProfile } from "@/hooks/useRH";
import {
    Briefcase,
    LogOut,
    Loader2,
    AlertTriangle
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SolicitadorSidebarProps {
    activeItem: string;
    onItemClick: (item: string) => void;
}

export default function SolicitadorSidebar({ activeItem, onItemClick }: SolicitadorSidebarProps) {
    const { user, signOut } = useAuth();
    const { data: rhProfile, isLoading: isLoadingProfile } = useRHProfile(user?.id);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { toast } = useToast();

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);

        try {
            await signOut();
            toast({
                title: "Logout realizado com sucesso!",
                description: "Até logo!",
            });
        } catch (error) {
            console.error('❌ Erro no logout:', error);
            toast({
                title: "Erro no logout",
                description: "Ocorreu um erro ao fazer logout. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsLoggingOut(false);
        }
    };

    if (isLoadingProfile) {
        return (
            <div className="w-64 bg-white border-r border-gray-200 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-cgb-primary" />
            </div>
        );
    }

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cgb-primary rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900">Portal de Solicitações</h2>
                        <p className="text-sm text-gray-500">Solicitador de Vagas</p>
                    </div>
                </div>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-gray-100">
                <div className="text-sm">
                    <p className="font-medium text-gray-900">
                        Olá, {rhProfile?.full_name || user?.email || 'Usuário'}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                        Bem-vindo(a) de volta!
                    </p>
                </div>
            </div>

            {/* Navigation - Apenas Gestão de Vagas */}
            <nav className="flex-1 p-4">
                <div className="space-y-2">
                    <Button
                        variant={activeItem === 'jobs' ? 'default' : 'ghost'}
                        className={cn(
                            "w-full justify-start gap-3 h-10",
                            activeItem === 'jobs'
                                ? "bg-cgb-primary text-white hover:bg-cgb-primary-dark"
                                : "text-gray-600 hover:text-cgb-primary hover:bg-gray-100"
                        )}
                        onClick={() => onItemClick('jobs')}
                    >
                        <Briefcase className="w-4 h-4" />
                        <span>Solicitação de Vagas</span>
                    </Button>
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-medium text-blue-900">Sobre este perfil</h4>
                            <p className="text-xs text-blue-700 mt-1">
                                Como Solicitador de Vagas, você pode criar solicitações que serão enviadas para aprovação da gerência.
                            </p>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-200">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-10 text-gray-600 hover:text-red-600 hover:bg-red-50"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <LogOut className="w-4 h-4" />
                    )}
                    <span>{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
                </Button>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                    © 2025 GRUPO CGB
                </p>
            </div>
        </div>
    );
} 