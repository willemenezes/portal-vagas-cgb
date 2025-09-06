import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import JobManagement from "@/components/admin/JobManagement";
import JobRequestManagement from "@/components/admin/JobRequestManagement";
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
import { useAuth } from "@/hooks/useAuth";
import { useRHProfile, RHUser } from "@/hooks/useRH";
import { Loader2 } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import LegalValidation from "@/components/admin/LegalValidation";

const Admin = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: rhProfile, isLoading: isLoadingProfile } = useRHProfile(user?.id);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

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
      case "selection-process":
        return <SelectionProcess />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={rhProfile.role}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Adicionar um cabeçalho de boas-vindas */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Olá, {rhProfile.full_name || user.email}!</h1>
          <p className="text-gray-500 mt-1">Bem-vindo(a) de volta ao seu portal.</p>
        </div>

        {renderContent()}
      </main>
    </div>
  );
};

export default Admin;
