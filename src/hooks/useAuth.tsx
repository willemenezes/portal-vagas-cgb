import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { validateEmail, validatePassword } from '@/lib/validators'; // Importando de um arquivo separado
import { useQueryClient } from '@tanstack/react-query';

// Interfaces e Tipos
export interface AuthProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  // Adicione outros campos de perfil conforme necessário
}

export interface UseAuthReturn {
  user: User | null;
  profile: AuthProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  hasPermission: (requiredRole: 'admin' | 'user') => boolean;
}

// Hook principal de autenticação
export const useAuth = (): UseAuthReturn => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
        throw error;
      }

      if (data) {
        setProfile(data as AuthProfile);
        return data as AuthProfile;
      }

      console.log('✨ [PROFILE] Perfil não encontrado, criando um novo...');

      const { data: rhUser, error: rhError } = await supabase
        .from('rh_users')
        .select('full_name')
        .eq('user_id', userId)
        .single();

      if (rhError && rhError.code !== 'PGRST116') {
        console.error('❌ [PROFILE] Erro ao verificar usuário RH:', rhError);
      }

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail,
          full_name: rhUser?.full_name || 'Novo Usuário',
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setProfile(newProfile as AuthProfile);
      return newProfile as AuthProfile;

    } catch (error) {
      console.error('💥 [PROFILE] Falha ao buscar ou criar perfil:', error);
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    setLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser.email);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);


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
    setProfile(null);
    setUser(null);
  }, [queryClient]);

  const isAdmin = useCallback((): boolean => {
    return profile?.role === 'admin';
  }, [profile]);

  const hasPermission = useCallback((requiredRole: 'admin' | 'user'): boolean => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    return profile.role === requiredRole;
  }, [profile]);

  return { user, profile, loading, signIn, signOut, isAdmin, hasPermission };
};
