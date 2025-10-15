import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CookieBanner } from "@/components/CookieBanner";
import Index from "@/pages/Index";
import JobDetail from "@/pages/JobDetail";
import JobApplication from "@/pages/JobApplication";
import ResumeSubmission from "@/pages/ResumeSubmission";
import Login from "@/pages/Login";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfUse from "@/pages/TermsOfUse";
import TVDashboard from "@/pages/TVDashboard";

import Admin from "@/pages/Admin";
import AdminSetupPage from "@/pages/AdminSetup";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Rotas públicas - sem ProtectedRoute por enquanto */}
            <Route path="/" element={<Index />} />
            <Route path="/vaga/:id" element={<JobDetail />} />
            <Route path="/candidatar/:id" element={<JobApplication />} />
            <Route path="/cadastrar-curriculo" element={<ResumeSubmission />} />
            <Route path="/login" element={<Login />} />
            <Route path="/politica-privacidade" element={<PrivacyPolicy />} />
            <Route path="/termos-uso" element={<TermsOfUse />} />

            {/* Rotas protegidas - para usuários autenticados (admins e RH) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAuth={true} requireAdmin={false}>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="/dashboard" element={<TVDashboard />} />
            <Route
              path="/admin-setup"
              element={
                <ProtectedRoute requireAuth={false}>
                  <AdminSetupPage />
                </ProtectedRoute>
              }
            />

            {/* Rota 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <CookieBanner />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
