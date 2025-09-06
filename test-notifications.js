// Script de teste para verificar notificações
// Execute este script no console do navegador (F12) quando estiver logado no admin

async function testNotifications() {
    console.log('🧪 Iniciando teste de notificações...');

    try {
        // Teste 1: Verificar se a função send-notification está disponível
        console.log('📡 Testando função send-notification...');

        const testResult = await supabase.functions.invoke('send-notification', {
            body: {
                type: 'new_job_request',
                recipients: [
                    {
                        email: 'willemenezes.jt@gmail.com',
                        name: 'Wille Menezes - Gerente',
                        role: 'gerente'
                    }
                ],
                data: {
                    jobTitle: 'TESTE - Técnico em Informática',
                    department: 'TI',
                    city: 'Belém',
                    state: 'PA',
                    senderName: 'Wille Menezes - Solicitador',
                    senderRole: 'Coordenador',
                    actionDate: new Date().toLocaleString('pt-BR')
                }
            }
        });

        console.log('✅ Resultado do teste:', testResult);

        if (testResult.error) {
            console.error('❌ Erro na função:', testResult.error);
        } else {
            console.log('🎉 Teste concluído com sucesso!');
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

// Para executar o teste, cole este código no console e execute:
// testNotifications();

console.log('📋 Script de teste carregado. Execute: testNotifications()');

