// Arquivo temporário para debug - deletar após resolver
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://csgmamxhqkqdknohfsfj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzZ21hbXhocWtxZGtub2hmc2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0ODEwMjYsImV4cCI6MjA2NTA1NzAyNn0.K1RsKmW-FMjdUxQfONCPS-DtZQ0QKVAdNIrajNc8OYo";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
    console.log('🚀 === TESTE DE DIAGNÓSTICO COMPLETO ===');
    console.log('🔗 URL:', SUPABASE_URL);
    console.log('🔑 Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');

    // Teste 1: Conectividade básica
    console.log('\n📡 Teste 1: Conectividade básica...');
    try {
        const response = await fetch(SUPABASE_URL + '/rest/v1/', {
            method: 'HEAD',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
            },
        });
        console.log('✅ Conectividade:', response.ok ? 'OK' : 'FALHOU', response.status);
    } catch (err) {
        console.error('❌ Erro de conectividade:', err);
        return;
    }

    // Teste 2: Query simples
    console.log('\n📊 Teste 2: Query de vagas...');
    try {
        const { data, error, status, statusText } = await supabase
            .from('jobs')
            .select('id, title, department, city, state, status')
            .eq('status', 'active')
            .limit(5);

        console.log('📋 Resultado completo:', {
            data,
            error,
            status,
            statusText,
            hasData: !!data,
            dataCount: data?.length || 0
        });

        if (error) {
            console.error('❌ Erro na query:', error);
            return;
        }

        if (data && data.length > 0) {
            console.log('✅ Sucesso! Vagas encontradas:');
            data.forEach((job, i) => {
                console.log(`  ${i + 1}. ${job.title} - ${job.city}/${job.state}`);
            });
        } else {
            console.log('⚠️ Nenhuma vaga encontrada');
        }
    } catch (err) {
        console.error('💥 Erro na query:', err);
    }

    // Teste 3: Verificar políticas RLS
    console.log('\n🔒 Teste 3: Verificando políticas RLS...');
    try {
        const { data: policies, error: policyError } = await supabase
            .rpc('get_table_policies', { table_name: 'jobs' })
            .select();

        if (policyError) {
            console.log('⚠️ Não foi possível verificar políticas RLS (normal)');
        } else {
            console.log('📝 Políticas encontradas:', policies);
        }
    } catch (err) {
        console.log('⚠️ Verificação de políticas RLS não disponível');
    }

    console.log('\n🎯 === FIM DO DIAGNÓSTICO ===');
}

async function testEnvironment() {
    console.log('🔧 === TESTE DE AMBIENTE ===');
    console.log('🌐 User Agent:', navigator.userAgent);
    console.log('🔗 URL atual:', window.location.href);
    console.log('📡 Online:', navigator.onLine);

    // Verificar variáveis de ambiente (se existirem)
    if (typeof import !== 'undefined' && import.meta && import.meta.env) {
        console.log('🔧 Variáveis de ambiente:');
        console.log('  VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
        console.log('  VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
    } else {
        console.log('⚠️ import.meta.env não disponível');
    }
}

// Para usar no console do navegador:
window.testSupabaseConnection = testConnection;
window.testEnvironment = testEnvironment;
window.supabaseDebug = { testConnection, testEnvironment };

console.log('🔧 Funções de debug carregadas:');
console.log('  - window.testSupabaseConnection()');
console.log('  - window.testEnvironment()');
console.log('  - window.supabaseDebug'); 