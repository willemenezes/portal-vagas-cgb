import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

// Definindo a interface para o retorno do hook para maior clareza
export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // useEffect para verificar a sessão do usuário na inicialização
  useEffect(() => {
    setLoading(true);
    // Verifica a sessão atual
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getSession();

    // Escuta mudanças no estado de autenticação (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT' || _event === 'TOKEN_REFRESHED') {
        setLoading(false);
      }
    });

    // Limpa a inscrição ao desmontar o componente
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('❌ [AUTH] Erro de autenticação:', error.message);
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email ou senha inválidos. Verifique suas credenciais.');
      }
      throw new Error('Ocorreu uma falha durante o login. Tente novamente.');
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ [AUTH] Erro no logout:', error);
      throw new Error('Falha ao fazer logout.');
    }
    setUser(null);
  }, []);

  return { user, loading, signIn, signOut };
};
