import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Eye, EyeOff, Shield, AlertTriangle } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, loading } = useAuth();
  const { toast } = useToast();
  const rateLimit = useRateLimit(5, 15 * 60 * 1000); // 5 tentativas, 15 minutos de bloqueio

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirecionar usuários já logados
  useEffect(() => {
    if (user) {
      const from = location.state?.from || '/admin';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (rateLimit.isBlocked) {
      toast({
        title: "Muitas tentativas de login",
        description: `Tente novamente em ${rateLimit.formatRemainingTime()}`,
        variant: "destructive",
      });
      return;
    }

    setError(null);

    try {
      await signIn(email, password);
      // Sucesso - limpar rate limit
      rateLimit.recordSuccessfulAttempt();

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Portal CGB",
      });

      // Redirecionar para a página de origem ou admin
      const from = location.state?.from || '/admin';
      navigate(from, { replace: true });

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro desconhecido.');
      // Registrar tentativa falhada
      rateLimit.recordFailedAttempt();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Background same as Index page */}
      <div className="absolute inset-0 bg-gradient-to-br from-cgb-cream via-white to-cgb-pearl"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(106,11,39,0.05)_0%,transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(196,83,111,0.03)_0%,transparent_50%)]"></div>

      {/* Background Image - Same as Index */}
      <div className="absolute inset-0 opacity-30 z-0">
        <img
          src="/CGBRH2.png"
          alt="CGB Background"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="w-full max-w-md relative z-10 mx-auto flex flex-col justify-center min-h-screen">
        {/* Back Button - Modern Design */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-8 text-gray-600 hover:text-cgb-primary hover:bg-gray-100 transition-colors group rounded-xl self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar ao site
        </Button>

        {/* Modern Login Card */}
        <Card className="bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="text-center px-6 py-8">
            {/* Logo CGB */}
            <div className="flex justify-center mb-6">
              <img
                src="/CGB.png"
                alt="CGB Logo"
                className="h-20 w-auto object-contain drop-shadow-sm"
              />
            </div>

            {/* Title simplificado */}
            <div className="mb-6">
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Portal Administrativo
              </CardTitle>
              <p className="text-gray-600">Acesse o painel de controle</p>
            </div>

            {/* Security Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Conexão Segura</span>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            {/* Alert Messages */}
            {rateLimit.isBlocked && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-800">Acesso temporariamente bloqueado</h4>
                    <p className="text-sm text-red-600 mt-1">
                      Muitas tentativas de login. Tente novamente em {rateLimit.formatRemainingTime()}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!rateLimit.isBlocked && rateLimit.attemptsRemaining < 5 && rateLimit.attemptsRemaining > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">Atenção</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      {rateLimit.attemptsRemaining} tentativas restantes antes do bloqueio.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 font-medium">
                  E-mail corporativo
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu.email@cgb.com.br"
                  className="h-12 border-2 border-gray-200 focus:border-cgb-primary focus:ring-cgb-primary/20 focus:ring-4 rounded-xl transition-all"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="h-12 pr-12 border-2 border-gray-200 focus:border-cgb-primary focus:ring-cgb-primary/20 focus:ring-4 rounded-xl transition-all"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1 h-10 w-10 text-gray-400 hover:text-cgb-primary hover:bg-gray-100 rounded-lg"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Error Message Display */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                  <p className="font-bold">Acesso Negado</p>
                  <p>{error}</p>
                </div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-cgb-primary hover:bg-cgb-primary-dark text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                disabled={loading || rateLimit.isBlocked}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Entrar no Portal
                  </>
                )}
              </Button>
            </form>

            {/* Footer Info */}
            <div className="pt-6 border-t border-gray-100 mt-8">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Sistema online e seguro</span>
                </div>
                <p className="text-xs text-gray-500">
                  Protegido por criptografia de ponta a ponta
                </p>

              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/CGB.png"
              alt="CGB Logo"
              className="h-10 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>
          <div className="space-y-2">
            <p className="text-gray-600 text-sm font-medium">
              © 2025 <span className="text-cgb-primary font-bold">GRUPO CGB</span>. Todos os direitos reservados.
            </p>
            <p className="text-gray-400 text-xs">
              Portal Administrativo - Sistema de Gestão de Carreiras
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
