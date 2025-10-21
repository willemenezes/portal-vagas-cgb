import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CookieBanner } from "@/components/CookieBanner";
import { lazy, Suspense } from "react";

// Lazy loading de componentes pesados
const Index = lazy(() => import("@/pages/Index"));
const JobDetail = lazy(() => import("@/pages/JobDetail"));
const JobApplication = lazy(() => import("@/pages/JobApplication"));
const ResumeSubmission = lazy(() => import("@/pages/ResumeSubmission"));
const Login = lazy(() => import("@/pages/Login"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("@/pages/TermsOfUse"));
const Admin = lazy(() => import("@/pages/Admin"));
const AdminSetupPage = lazy(() => import("@/pages/AdminSetup"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // 10 minutos (aumentado para reduzir queries)
      gcTime: 30 * 60 * 1000, // 30 minutos (cache mais longo)
    },
  },
});

// Componente de loading para Suspense
const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cgb-primary mx-auto mb-4"></div>
      <p className="text-gray-600">Carregando...</p>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background">
          <Suspense fallback={<LoadingFallback />}>
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
          </Suspense>
          <Toaster />
          <CookieBanner />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
