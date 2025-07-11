
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, UserCheck } from "lucide-react";

const AdminSetup = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("wille.menezes@cgbengenharia.com.br");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Erro na confirmação",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Criar usuário administrador
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Wille Menezes',
            role: 'admin'
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Atualizar perfil para garantir que seja admin
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: 'Wille Menezes',
            role: 'admin'
          });

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
        }

        toast({
          title: "Administrador criado com sucesso!",
          description: "O usuário administrador foi configurado corretamente",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar administrador",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-cgb-primary to-cgb-accent rounded-2xl flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-cgb-primary">
          Configurar Administrador
        </CardTitle>
        <p className="text-cgb-primary/70">Configure a conta do administrador geral</p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleAdminSetup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-cgb-primary font-semibold">
              E-mail do Administrador
            </Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/80 border-cgb-primary/30 focus:border-cgb-accent"
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-cgb-primary font-semibold">
              Senha
            </Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Digite a senha"
              className="bg-white/80 border-cgb-primary/30 focus:border-cgb-accent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-cgb-primary font-semibold">
              Confirmar Senha
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirme a senha"
              className="bg-white/80 border-cgb-primary/30 focus:border-cgb-accent"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-cgb-primary to-cgb-accent hover:from-cgb-primary-dark hover:to-cgb-accent-dark text-white font-bold"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Criar Administrador
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminSetup;
