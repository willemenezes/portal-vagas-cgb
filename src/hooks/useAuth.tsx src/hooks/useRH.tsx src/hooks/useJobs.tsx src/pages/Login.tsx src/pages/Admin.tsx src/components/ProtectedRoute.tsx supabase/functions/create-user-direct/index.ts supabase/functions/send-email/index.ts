import React, { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const [profile, setProfile] = useState<AuthProfile | null>(null);
const [loading, setLoading] = useState(true);

const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
        if (data) {
            setProfile(data as AuthProfile);
            return data as AuthProfile;
        }

        const { data: rhUser, error: rhError } = await supabase
            .from('rh_users')
        if (rhError && rhError.code !== 'PGRST116') {
        }

        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
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

const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('❌ [AUTH] Erro no logout:', error);
        throw new Error('Falha ao fazer logout.');
    }
    setProfile(null);
}, []);

if (error) {
    console.error('❌ [AUTH] Erro de autenticação:', error.message);
    if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email ou senha inválidos. Verifique suas credenciais.');
    }
    throw new Error('Ocorreu uma falha durante o login. Tente novamente.');
} 