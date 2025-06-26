
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AdminSetup from "@/components/AdminSetup";

const AdminSetupPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 relative overflow-hidden">
      {/* Background effects similar to login page */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cgb-primary/20 via-cgb-accent/15 to-cgb-primary-dark/25"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.08)_1px,_transparent_0)] bg-[length:40px_40px]"></div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-cgb-primary/15 via-cgb-accent/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-gradient-to-tl from-cgb-secondary/12 via-cgb-accent/8 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="w-full max-w-2xl relative z-10 mx-auto p-4 flex flex-col justify-center min-h-screen">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/login")}
          className="mb-8 text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-300 group rounded-xl self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar ao Login
        </Button>
        
        {/* Setup Component */}
        <AdminSetup />
        
        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm">
            Esta página é para configuração inicial do administrador.
          </p>
          <p className="text-white/40 text-xs mt-1">
            Use apenas uma vez para criar a conta do administrador geral.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSetupPage;
