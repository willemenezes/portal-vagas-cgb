// Script para testar configuração SMTP
// Execute no console do navegador (F12) quando estiver logado

async function testSMTPConfig() {
    console.log('🧪 Testando configuração SMTP...');

    try {
        // Teste direto da função send-email
        const emailTest = await supabase.functions.invoke('send-email', {
            body: {
                to: 'willemenezes.jt@gmail.com',
                subject: '🧪 Teste de Configuração SMTP - CGB Vagas',
                html: `
                    <h2>✅ Configuração SMTP Funcionando!</h2>
                    <p>Este é um teste de configuração do sistema de notificações.</p>
                    <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                    <p><strong>Status:</strong> SMTP configurado corretamente</p>
                `,
                fromName: 'Portal CGB Vagas',
                fromEmail: 'naoresponda@cgbvagas.com.br'
            }
        });

        console.log('📧 Resultado do teste de email:', emailTest);

        if (emailTest.error) {
            console.error('❌ Erro na configuração SMTP:', emailTest.error);
            console.log('💡 Verifique se as variáveis SMTP estão configuradas no Supabase');
        } else {
            console.log('🎉 Email enviado com sucesso! Verifique a caixa de entrada.');
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

// Para executar: testSMTPConfig();
console.log('📋 Script de teste SMTP carregado. Execute: testSMTPConfig()');

