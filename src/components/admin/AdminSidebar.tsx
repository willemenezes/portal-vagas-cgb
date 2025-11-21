import {
    Users,
    Briefcase,
    LogOut,
    Home,
    TrendingUp,
    Shield,
    Archive,
    UserCheck,
    FileText,
    CheckCircle,
    Send,
    Gavel,
    Loader2,
    Calendar,
    Menu,
    Trash2
} from "lucide-react";

// Adicionei um tipo para as props para melhor organização
type AdminSidebarProps = {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    userRole: 'admin' | 'recruiter' | 'manager' | 'juridico' | 'solicitador';
    onLogout: () => void;
    isLoggingOut?: boolean;
    onCollapse?: () => void; // usado no desktop para recolher a sidebar
};

const NavItem = ({ icon: Icon, text, active, onClick, isNew = false }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-4 py-3 text-base font-semibold transition-all duration-200 rounded-lg group
      ${active
                ? "bg-cgb-primary text-white shadow-md"
                : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
            }`}
    >
        <Icon className={`h-5 w-5 shrink-0 transition-colors ${active ? "text-white" : "text-slate-500 group-hover:text-slate-900"}`} />
        <span className="flex-1 text-left">{text}</span>
        {isNew && (
            <span className="bg-cgb-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
                NEW
            </span>
        )}
    </button>
);

export const AdminSidebar = ({ activeTab, setActiveTab, userRole, onLogout, isLoggingOut, onCollapse }: AdminSidebarProps) => {
    let menuItems = [];

    if (userRole === 'manager') {
        // Menu específico para Gerência
        menuItems = [
            { id: "dashboard", icon: Home, text: "Dashboard", action: () => setActiveTab("dashboard") },
            { id: "unified-approvals", icon: CheckCircle, text: "Aprovações", action: () => setActiveTab("unified-approvals") },
            { id: "contract-deadlines", icon: Calendar, text: "Prazos de Contratação", action: () => setActiveTab("contract-deadlines") },
            { id: "selection-process", icon: Users, text: "Processos Seletivos", action: () => setActiveTab("selection-process") },
            { id: "hired", icon: UserCheck, text: "Contratados", action: () => setActiveTab("hired") },
            { id: "reports", icon: FileText, text: "Relatórios", action: () => setActiveTab("reports") },
        ];
    } else if (userRole === 'juridico') {
        // Menu específico para Jurídico
        menuItems = [
            { id: "dashboard", icon: Home, text: "Dashboard", action: () => setActiveTab("dashboard") },
            { id: "legal-validation", icon: Gavel, text: "Validação", action: () => setActiveTab("legal-validation") },
        ];
    } else if (userRole === 'solicitador') {
        // Menu específico para Solicitador de Vagas
        menuItems = [
            { id: "dashboard", icon: Home, text: "Dashboard", action: () => setActiveTab("dashboard") },
            { id: "jobs", icon: Briefcase, text: "Minhas Solicitações", action: () => setActiveTab("jobs") },
        ];
    } else {
        // Menu para Admin e Recrutador
        menuItems = [
            { id: "dashboard", icon: Home, text: "Dashboard", action: () => setActiveTab("dashboard") },
            { id: "jobs", icon: Briefcase, text: "Gestão Completa de Vagas", action: () => setActiveTab("jobs") },
            { id: "contract-deadlines", icon: Calendar, text: "Prazos de Contratação", action: () => setActiveTab("contract-deadlines") },
            { id: "selection-process", icon: TrendingUp, text: "Processos Seletivos", action: () => setActiveTab("selection-process") },
            { id: "candidates", icon: Users, text: "Candidatos", action: () => setActiveTab("candidates") },
            { id: "hired", icon: UserCheck, text: "Contratados", action: () => setActiveTab("hired") },
            { id: "talent-bank", icon: Archive, text: "Cadastro de Currículos", action: () => setActiveTab("talent-bank") },
            { id: "reports", icon: FileText, text: "Relatórios", action: () => setActiveTab("reports") },
        ];

        // Adiciona Solicitações de Vagas apenas para Admin
        if (userRole === 'admin') {
            menuItems.splice(1, 0, { id: "job-requests", icon: Send, text: "Solicitações de Vagas", action: () => setActiveTab("job-requests") });
        }

        // Adiciona Gestão de RH apenas para Admin
        if (userRole === 'admin') {
            menuItems.push({ id: "rh", icon: Shield, text: "Gestão de RH", action: () => setActiveTab("rh") });
            menuItems.push({ id: "deleted-jobs", icon: Trash2, text: "Vagas Excluídas", action: () => setActiveTab("deleted-jobs") });
        }
    }

    return (
        <aside className="w-72 h-screen bg-cgb-silver text-gray-800 flex flex-col shadow-2xl flex-shrink-0 overflow-hidden">
            {/* Container interno com padding para criar o "card" */}
            <div className="flex flex-col h-full p-5">
                {/* Header com botão de fechar (somente se onCollapse fornecido) */}
                <div className="flex items-center justify-between mb-6 px-2 pt-2 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <img src="/CGB.png" alt="CGB Energia Logo" className="h-11 w-auto" loading="lazy" />
                        <span className="text-xl font-semibold tracking-wider text-cgb-primary-dark">Portal do RH</span>
                    </div>
                    {onCollapse && (
                        <button
                            type="button"
                            aria-label="Fechar menu"
                            onClick={onCollapse}
                            className="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 hover:bg-white/70"
                        >
                            <Menu className="w-5 h-5 text-gray-700" />
                        </button>
                    )}
                </div>

                {/* Nav com scroll quando necessário */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden pr-2 -mr-2">
                    <div className="flex flex-col gap-2.5">
                        {menuItems.map((item) => (
                            <NavItem
                                key={item.id}
                                icon={item.icon}
                                text={item.text}
                                active={activeTab === item.id}
                                onClick={item.action}
                                isNew={item.isNew}
                            />
                        ))}
                    </div>
                </nav>

                {/* Footer fixo na parte inferior */}
                <div className="flex-shrink-0 mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={onLogout}
                            disabled={isLoggingOut}
                            className={`w-full flex items-center gap-4 px-4 py-3 text-base font-semibold transition-colors rounded-lg group ${isLoggingOut
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "text-red-600 hover:bg-red-100 hover:text-red-700"
                                }`}
                        >
                            {isLoggingOut ? (
                                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-gray-400" />
                            ) : (
                                <LogOut className="h-5 w-5 shrink-0 text-red-500 group-hover:text-red-700" />
                            )}
                            <span>{isLoggingOut ? "Saindo..." : "Sair"}</span>
                        </button>
                    </div>
                    <div className="text-center text-gray-600 text-xs mt-5">
                        <p>&copy; 2025 Grupo CGB.</p>
                        <p className="mt-1">Versão {__APP_VERSION__} ({__COMMIT_HASH__})</p>
                        <p className="mt-1">Programado por Wille Menezes</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}; 