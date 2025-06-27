import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import JobManagement from "@/components/admin/JobManagement";
import CandidateManagement from "@/components/admin/CandidateManagement";
import ResumeManagement from "@/components/admin/ResumeManagement";
import Dashboard from "@/components/admin/Dashboard";
import TalentBankManagement from "@/components/admin/TalentBankManagement";
import RHManagement from "@/components/admin/RHManagement";
import SelectionProcess from "@/components/admin/SelectionProcess";
import HiredManagement from "@/components/admin/HiredManagement";
import ReportsManagement from "@/components/admin/ReportsManagement";
import { useAuth } from "@/hooks/useAuth";
import { useRHProfile, RHUser } from "@/hooks/useRH";
import { Loader2 } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import ApprovalManagement from "@/components/admin/ApprovalManagement";
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
        setActiveTab('approvals');
      } else if (rhProfile.role === 'juridico') {
        setActiveTab('legal-validation');
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
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error("Erro no logout:", error);
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
      case "approvals":
        return <ApprovalManagement />;
      case "legal-validation":
        return <LegalValidation />;
      case "jobs":
        return <JobManagement />;
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
