import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { validateEmail } from '@/lib/validators';
import { useQueryClient } from '@tanstack/react-query';

// Interfaces e Tipos simplificados
export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Hook principal de autenticação - focado apenas na autenticação
export const useAuth = (): UseAuthReturn => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!validateEmail(email)) {
      throw new Error('Formato de email inválido.');
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('❌ [AUTH] Erro de autenticação:', error.message);
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email ou senha inválidos. Verifique suas credenciais.');
      }
      throw new Error('Ocorreu uma falha durante o login. Tente novamente.');
    }

    console.log('✅ [AUTH] Login realizado com sucesso!');
    await queryClient.removeQueries({ queryKey: ['rhProfile'] });
  }, [queryClient]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ [AUTH] Erro no logout:', error);
      throw new Error('Falha ao fazer logout.');
    }
    await queryClient.removeQueries({ queryKey: ['rhProfile'] });
    setUser(null);
  }, [queryClient]);

  return { user, loading, signIn, signOut };
};
