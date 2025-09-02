// Configuração do Supabase - Usando variáveis de ambiente
export const supabaseConfig = {
    url: import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || 'https://csgmamxhqkqdknohfsfj.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzZ21hbXhocWtxZGtub2hmc2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0ODEwMjYsImV4cCI6MjA2NTA1NzAyNn0.K1RsKmW-FMjdUxQfONCPS-DtZQ0QKVAdNIrajNc8OYo',
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