import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import JobManagement from "@/components/admin/JobManagement";
import JobRequestManagement from "@/components/admin/JobRequestManagement";
import JobRequestsManagement from "@/components/admin/JobRequestsManagement";
import CandidateManagement from "@/components/admin/CandidateManagement";
import ResumeManagement from "@/components/admin/ResumeManagement";
import Dashboard from "@/components/admin/Dashboard";
import TalentBankManagement from "@/components/admin/TalentBankManagement";
import RHManagement from "@/components/admin/RHManagement";
import SelectionProcess from "@/components/admin/SelectionProcess";
import HiredManagement from "@/components/admin/HiredManagement";
import ReportsManagement from "@/components/admin/ReportsManagement";
import UnifiedApprovals from "@/components/admin/UnifiedApprovals";
import JobApprovalsWrapper from "@/components/admin/JobApprovalsWrapper";
import ContractDeadlineManagement from "@/components/admin/ContractDeadlineManagement";
import DeletedJobsManagement from "@/components/admin/DeletedJobsManagement";
import { useAuth } from "@/hooks/useAuth";
import { useRHProfile, RHUser } from "@/hooks/useRH";
import { Loader2, Menu, X } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import LegalValidation from "@/components/admin/LegalValidation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const Admin = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: rhProfile, isLoading: isLoadingProfile } = useRHProfile(user?.id);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarVisibleDesktop, setIsSidebarVisibleDesktop] = useState(true);

  useEffect(() => {
    if (rhProfile) {
      if (rhProfile.role === 'manager') {
        setActiveTab('unified-approvals');
      } else if (rhProfile.role === 'juridico') {
        setActiveTab('legal-validation');
      } else if (rhProfile.role === 'solicitador') {
        setActiveTab('jobs');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [rhProfile]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Previne múltiplos cliques

    setIsLoggingOut(true);

    try {
      // Timeout de 10 segundos para evitar travamentos
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout no logout')), 10000)
      );

      const logoutPromise = signOut();

      await Promise.race([logoutPromise, timeoutPromise]);

      // Limpar cache e navegar
      navigate('/', { replace: true });

    } catch (error) {
      console.error("Erro no logout:", error);

      // Forçar logout local mesmo se houver erro no servidor
      localStorage.clear();
      sessionStorage.clear();

      // Navegar mesmo com erro
      navigate('/', { replace: true });

      // Recarregar a página para garantir limpeza completa
      window.location.reload();

    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading || isLoadingProfile) {
    return <div className="flex items-center justify-center h-screen bg-gray-100"><Loader2 className="w-10 h-10 animate-spin text-cgb-primary" /></div>;
  }

  if (!user || !rhProfile) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "unified-approvals":
        return <UnifiedApprovals />;
      case "legal-validation":
        return <LegalValidation />;
      case "job-requests":
        return (rhProfile?.role === 'admin' || rhProfile?.is_admin || rhProfile?.role === 'recruiter') ? <JobRequestsManagement /> : null;
      case "jobs":
        return rhProfile?.role === 'solicitador' ? <JobRequestManagement /> : <JobManagement />;
      case "contract-deadlines":
        return <ContractDeadlineManagement />;
      case "selection-process":
        return <SelectionProcess />;
      case "candidates":
        return <CandidateManagement />;
      case "hired":
        return <HiredManagement />;
      case "talent-bank":
        return <TalentBankManagement />;
      case "reports":
        return <ReportsManagement />;
      case "rh":
        return rhProfile?.role === 'admin' ? <RHManagement /> : null;
      case "deleted-jobs":
        return rhProfile?.role === 'admin' ? <DeletedJobsManagement /> : null;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Sidebar desktop (colapsável) */}
      {isSidebarVisibleDesktop && (
        <div className="hidden md:block">
          <AdminSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userRole={rhProfile.role}
            onLogout={handleLogout}
            isLoggingOut={isLoggingOut}
            onCollapse={() => setIsSidebarVisibleDesktop(false)}
          />
        </div>
      )}

      {/* Conteúdo principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Barra superior: botão de menu no mobile e colapsar no desktop */}
        <div className="mb-4 flex items-center justify-between">
          {/* Mobile: abrir Sheet */}
          <div className="md:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="border-gray-300"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          {/* Desktop: controle agora fica dentro da própria sidebar */}
          <div className="hidden md:flex"></div>
        </div>
        {/* Adicionar um cabeçalho de boas-vindas */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Olá, {rhProfile.full_name || user.email}!</h1>
          <p className="text-gray-500 mt-1">Bem-vindo(a) de volta ao seu portal.</p>
        </div>

        {renderContent()}
      </main>

      {/* Sidebar mobile como Sheet */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-[300px] bg-white p-0">
          <AdminSidebar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setIsSidebarOpen(false);
            }}
            userRole={rhProfile.role}
            onLogout={async () => {
              setIsSidebarOpen(false);
              await handleLogout();
            }}
            isLoggingOut={isLoggingOut}
          />
        </SheetContent>
      </Sheet>

      {/* Botão flutuante para reabrir a sidebar no desktop quando oculta */}
      {!isSidebarVisibleDesktop && (
        <div className="hidden md:block fixed left-4 top-4 z-40">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSidebarVisibleDesktop(true)}
            className="border-gray-300 bg-white"
            aria-label="Mostrar menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Admin;
