# 🧪 Testes de Email - Guia Prático Rápido

## 🎯 **TESTE 1: Verificar Conexão SMTP (NOVO!)**

### Passo 1: Deploy da função de teste
1. No Supabase Dashboard → **Edge Functions**
2. Faça deploy da função **`test-smtp`** (se ainda não fez)
3. Ou via CLI: `supabase functions deploy test-smtp`

### Passo 2: Executar o teste
1. Clique em **"Test"** na função `test-smtp`
2. Ou acesse diretamente:
   ```
   https://csgmamxhqkqdknohfsfj.supabase.co/functions/v1/test-smtp
   ```

### Passo 3: Verificar resultado
A função vai testar 3 configurações:
- ✅ Porta **587** com TLS
- ✅ Porta **465** com TLS
- ✅ Porta **25** sem TLS

**Resultado esperado:**
```json
{
  "message": "Testes de conexão SMTP concluídos",
  "results": [
    { "port": 587, "tls": true, "status": "✅ Sucesso" },
    { "port": 465, "tls": true, "status": "❌ Erro: ..." },
    { "port": 25, "tls": false, "status": "❌ Erro: ..." }
  ]
}
```

**Se TODOS falharem:** O servidor SMTP não está acessível externamente.

---

## 🧪 **TESTE 2: Teste Manual via Console do Navegador**

### Passo 1: Abrir o Console
1. Acesse: `http://192.168.70.21:8080/admin` (ou sua URL)
2. Pressione **F12** → Aba **Console**

### Passo 2: Executar o teste
Cole e execute este código (substitua os valores):

```javascript
// Substitua estes valores:
const SUPABASE_URL = 'https://csgmamxhqkqdknohfsfj.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_ANON_KEY_AQUI'; // Pegue em Settings → API

fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({
    to: 'sistemas@cgbengenharia.com.br',
    subject: '🧪 Teste de Email - Sistema CGB Vagas',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="background: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6a0b27;">✅ Teste de Email Funcionando!</h2>
          <p>Se você recebeu este email, o sistema está configurado corretamente.</p>
          <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <p><strong>Servidor SMTP:</strong> mail.cgbengenharia.com.br:587</p>
        </div>
      </div>
    `,
    fromName: 'Portal CGB Vagas',
    fromEmail: 'naoresponda@grupocgb.com.br'
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Resposta:', data);
  if (data.success) {
    alert('✅ Email enviado com sucesso! Verifique a caixa de entrada.');
  } else {
    alert('❌ Erro: ' + (data.error || 'Erro desconhecido'));
  }
})
.catch(err => {
  console.error('❌ Erro:', err);
  alert('❌ Erro ao enviar: ' + err.message);
});
```

### Passo 3: Verificar resultado
- ✅ **Se aparecer `success: true`:** Email foi enviado!
- ❌ **Se aparecer erro:** Veja a mensagem e verifique os logs

---

## 🧪 **TESTE 3: Teste Real - Aprovar Vaga**

### Passo 1: Criar uma solicitação de teste
1. Acesse: **Admin** → **Solicitações de Vagas**
2. Crie uma nova solicitação:
   - Título: `🧪 TESTE EMAIL - Vaga Teste`
   - Departamento: `Sesmt` (ou qualquer um)
   - Cidade: `Santarém`
   - Estado: `PA`
   - Descrição: `Este é um teste do sistema de email`

### Passo 2: Aprovar a solicitação
1. Faça login como **Gerente**
2. Vá em **Aprovações**
3. Clique em **"Analisar"** na solicitação criada
4. Clique em **"Aprovar"**

### Passo 3: Verificar logs
1. Supabase Dashboard → **Edge Functions** → `send-notification` → **Logs**
2. Procure por:
   ```
   📧 Enviando notificações de aprovação...
   👥 Destinatários da aprovação: X
   ✅ Resultado do envio de aprovação: {...}
   ```

### Passo 4: Verificar emails
- ✅ Verifique a caixa de entrada de:
  - `sistemas@cgbengenharia.com.br`
  - Gerente que aprovou
  - RH da região
- ⚠️ **IMPORTANTE:** Verifique também a pasta de **SPAM**

---

## 🔍 **Como Verificar os Logs**

### No Supabase Dashboard:
1. **Edge Functions** → `send-email` → **Logs**
2. Procure por estas mensagens:

**✅ Sucesso:**
```
📧 Tentando enviar email para: sistemas@cgbengenharia.com.br
🔐 Conectando com TLS na porta 587...
✅ Conectado ao servidor SMTP
✅ Email enviado com sucesso para: sistemas@cgbengenharia.com.br
```

**❌ Erro:**
```
❌ Erro ao enviar e-mail: DenoStdInternalError: bufio: caught error...
```

### No Console do Navegador:
1. Pressione **F12** → **Console**
2. Procure por:
   - `📧 Enviando notificação...`
   - `✅ Resultado do envio...`
   - `❌ Erro ao enviar notificação...`

---

## 🐛 **Troubleshooting Rápido**

### ❌ Erro: `bufio: caught error from readSlice()`
**Causa:** Servidor SMTP não está respondendo corretamente ou conexão foi interrompida.

**Soluções:**
1. ✅ Execute o **TESTE 1** (test-smtp) para ver qual porta funciona
2. ✅ Verifique se o servidor `mail.cgbengenharia.com.br` está acessível
3. ✅ Tente trocar a porta de 587 para 25 ou 465
4. ✅ Verifique se há firewall bloqueando

### ❌ Erro: `CORS policy`
**Causa:** Origin não permitido.

**Solução:** Já foi corrigido! Se ainda aparecer, verifique se fez redeploy das Edge Functions.

### ❌ Erro: `SMTP not configured`
**Causa:** Variáveis de ambiente não configuradas.

**Solução:**
1. Supabase Dashboard → **Settings** → **Edge Functions** → **Secrets**
2. Adicione:
   - `SMTP_HOST` = `mail.cgbengenharia.com.br`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = `ti.belem@cgbengenharia.com.br`
   - `SMTP_PASSWORD` = `H6578m2024@cgb`

### ❌ Email não chega, mas logs mostram sucesso
**Soluções:**
1. ✅ Verifique pasta de **SPAM**
2. ✅ Verifique se o email do destinatário está correto
3. ✅ Verifique se o servidor SMTP não está bloqueando o envio

---

## ✅ **Checklist de Testes**

Execute na ordem:

- [ ] **Teste 1:** Função `test-smtp` - Verificar qual porta SMTP funciona
- [ ] **Teste 2:** Teste manual via console - Enviar email direto
- [ ] **Teste 3:** Teste real - Aprovar vaga e verificar emails
- [ ] **Verificação:** Emails chegam na caixa de entrada (não no spam)
- [ ] **Verificação:** Logs mostram sucesso em todos os envios

---

## 📊 **Resultado Esperado**

Após todos os testes, você deve ver:

### Nos Logs:
```
📧 Configurações SMTP: { host: "✅ Configurado", port: "✅ Configurado", ... }
📨 Requisição recebida: POST /functions/v1/send-email
📧 Tentando enviar email para: sistemas@cgbengenharia.com.br
🔐 Conectando com TLS na porta 587...
✅ Conectado ao servidor SMTP
✅ Email enviado com sucesso para: sistemas@cgbengenharia.com.br
```

### Na Caixa de Entrada:
- ✅ Email recebido de `naoresponda@grupocgb.com.br`
- ✅ Assunto correto (ex: "✅ Solicitação de Vaga Aprovada")
- ✅ Conteúdo HTML formatado corretamente

---

## 🆘 **Precisa de Ajuda?**

Se algum teste falhar:
1. ✅ Copie os logs da Edge Function
2. ✅ Copie o erro do console do navegador
3. ✅ Execute o TESTE 1 (test-smtp) e veja qual porta funciona
4. ✅ Verifique se as variáveis SMTP estão configuradas

**Próximo passo:** Se o SMTP da CGB não funcionar, podemos configurar Gmail ou SendGrid como alternativa temporária.
