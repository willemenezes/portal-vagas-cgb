import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import JobManagement from "@/components/admin/JobManagement";
import CandidateManagement from "@/components/admin/CandidateManagement";
import ResumeManagement from "@/components/admin/ResumeManagement";
import Dashboard from "@/components/admin/Dashboard";
import TalentBankManagement from "@/components/admin/TalentBankManagement";
import RHManagement from "@/components/admin/RHManagement";
import SelectionProcess from "@/components/admin/SelectionProcess";
import HiredManagement from "@/components/admin/HiredManagement";
import {
  BarChart3,
  Users,
  FileText,
  Briefcase,
  LogOut,
  Home,
  TrendingUp,
  Zap,
  Shield,
  Archive,
  ChevronDown,
  UserCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRHProfile } from "@/hooks/useRH";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const Admin = () => {
  const { profile, loading, signOut, isAdmin, hasPermission } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: rhProfile, isLoading: isLoadingProfile } = useRHProfile(profile?.id);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !profile) {
      navigate("/login");
    }
  }, [profile, loading, navigate]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      // ... (tratamento de erro)
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleForceLogout = () => {
    console.log('🔧 [ADMIN] Logout forçado acionado...');

    // Limpar tudo manualmente
    localStorage.clear();
    sessionStorage.clear();

    toast({
      title: "Logout forçado",
      description: "Dados limpos e redirecionando...",
    });

    // Forçar reload da página para limpar estado
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  };

  const handleGoHome = () => {
    navigate("/");
  };

  if (isLoadingProfile) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Cabeçalho Fixo Modernizado */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-30 shadow-sm border-b border-gray-100">
        <div className="container-modern flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <Link to="/">
              <img src="/CGB.png" alt="CGB Energia Logo" className="h-10 w-auto" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Portal Administrativo</h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-green-700">Sistema Online</span>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href="/" target="_blank" rel="noopener noreferrer">
                <Home className="w-4 h-4 mr-2" />
                Página Inicial
              </a>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="flex flex-col text-right">
                    <span className="font-semibold text-sm">{rhProfile?.full_name || profile?.email}</span>
                    <span className="text-xs text-gray-500">{rhProfile?.is_admin ? 'Administrador' : 'RH'}</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container-modern py-10 relative z-10">
        {/* Main Content com Tabs Modernizadas */}
        <Tabs defaultValue="dashboard" className="space-y-8">
          <TabsList className="grid w-full grid-cols-7 bg-white border border-gray-200 rounded-xl p-1 shadow-lg">
            <TabsTrigger
              value="dashboard"
              className="rounded-lg font-semibold text-sm data-[state=active]:bg-cgb-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="jobs"
              className="rounded-lg font-semibold text-sm data-[state=active]:bg-cgb-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Gestão de Vagas
            </TabsTrigger>
            <TabsTrigger
              value="selection-process"
              className="rounded-lg font-semibold text-sm data-[state=active]:bg-cgb-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Processos Seletivos
            </TabsTrigger>
            <TabsTrigger
              value="candidates"
              className="rounded-lg font-semibold text-sm data-[state=active]:bg-cgb-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <Users className="w-4 h-4 mr-2" />
              Candidatos
            </TabsTrigger>
            <TabsTrigger
              value="hired"
              className="rounded-lg font-semibold text-sm data-[state=active]:bg-cgb-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Contratados
            </TabsTrigger>
            <TabsTrigger
              value="talent-bank"
              className="rounded-lg font-semibold text-sm data-[state=active]:bg-cgb-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <Archive className="w-4 h-4 mr-2" />
              Banco de Talentos
            </TabsTrigger>
            {rhProfile?.is_admin && (
              <TabsTrigger
                value="rh"
                className="rounded-lg font-semibold text-sm data-[state=active]:bg-cgb-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
              >
                <Shield className="w-4 h-4 mr-2" />
                Gestão de RH
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            <Dashboard />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-8">
            <JobManagement />
          </TabsContent>

          <TabsContent value="candidates" className="space-y-8">
            <CandidateManagement />
          </TabsContent>

          <TabsContent value="hired" className="space-y-8">
            <HiredManagement />
          </TabsContent>

          <TabsContent value="talent-bank" className="space-y-8">
            <TalentBankManagement />
          </TabsContent>

          {rhProfile?.is_admin && (
            <TabsContent value="rh" className="space-y-8">
              <RHManagement />
            </TabsContent>
          )}

          <TabsContent value="selection-process" className="space-y-8">
            <SelectionProcess />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
