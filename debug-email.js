// Debug detalhado do envio de email
// Execute no console do navegador (F12)

async function debugEmail() {
    console.log('🔍 Iniciando debug detalhado...');

    try {
        console.log('📡 Testando função send-email...');

        const response = await supabase.functions.invoke('send-email', {
            body: {
                to: 'willemenezes.jt@gmail.com',
                subject: '🔍 DEBUG - Teste de Email',
                html: '<h1>Teste de Debug</h1><p>Este é um teste de debug.</p>',
                fromName: 'Debug CGB',
                fromEmail: 'debug@cgbvagas.com.br'
            }
        });

        console.log('📊 Resposta completa:', response);
        console.log('📊 Tipo da resposta:', typeof response);
        console.log('📊 Chaves da resposta:', Object.keys(response || {}));

        if (response && response.data) {
            console.log('📊 Dados da resposta:', response.data);
        }

        if (response && response.error) {
            console.error('❌ Erro na resposta:', response.error);
            console.error('❌ Detalhes do erro:', JSON.stringify(response.error, null, 2));
        }

        if (response && response.message) {
            console.log('✅ Mensagem:', response.message);
        }

    } catch (error) {
        console.error('❌ Erro capturado:', error);
        console.error('❌ Stack trace:', error.stack);
    }
}

// Para executar: debugEmail();
console.log('🔍 Debug carregado. Execute: debugEmail()');

