// Configuração do Supabase - Usando APENAS variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

// Validação crítica: garantir que as variáveis de ambiente estejam definidas
if (!supabaseUrl) {
    throw new Error('❌ VITE_SUPABASE_URL não está definida nas variáveis de ambiente');
}

if (!supabaseAnonKey) {
    throw new Error('❌ VITE_SUPABASE_ANON_KEY não está definida nas variáveis de ambiente');
}

export const supabaseConfig = {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    options: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        },
        db: {
            schema: 'public'
        },
        global: {
            headers: {
                'x-client-info': 'cgb-portal@1.0.0'
            }
        }
    }
}; 