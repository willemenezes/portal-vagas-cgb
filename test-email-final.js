// Teste final de envio de email
// Execute no console do navegador (F12) quando estiver logado

async function testEmailFinal() {
    console.log('🧪 Teste final de envio de email...');

    try {
        // Teste direto da função send-email
        const emailTest = await supabase.functions.invoke('send-email', {
            body: {
                to: 'willemenezes.jt@gmail.com',
                subject: '🎉 TESTE FINAL - CGB Vagas Notificações',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #6a0b27;">✅ CONFIGURAÇÃO SMTP FUNCIONANDO!</h2>
                        <p>Este é um teste final do sistema de notificações do Portal CGB Vagas.</p>
                        <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #6a0b27; margin: 20px 0;">
                            <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                            <p><strong>Status:</strong> SMTP configurado e funcionando</p>
                            <p><strong>Próximo passo:</strong> Testar notificações do fluxo completo</p>
                        </div>
                        <p>Se você recebeu este email, as notificações estão funcionando perfeitamente! 🚀</p>
                    </div>
                `,
                fromName: 'Portal CGB Vagas',
                fromEmail: 'naoresponda@cgbvagas.com.br'
            }
        });

        console.log('📧 Resultado do teste:', emailTest);

        if (emailTest.error) {
            console.error('❌ Erro:', emailTest.error);
        } else {
            console.log('🎉 Email enviado! Verifique a caixa de entrada.');
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

// Para executar: testEmailFinal();
console.log('📋 Teste final carregado. Execute: testEmailFinal()');

