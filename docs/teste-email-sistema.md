# 🧪 Guia de Testes - Sistema de Email CGB VAGAS

## ✅ **Testes Rápidos para Verificar se o Email Está Funcionando**

---

## 🎯 **Teste 1: Verificar Configuração SMTP**

### Via Supabase Dashboard:
1. Acesse: **Edge Functions** → `send-email` → **Logs**
2. Procure por: `📧 Configurações SMTP:`
3. Deve aparecer:
   ```
   📧 Configurações SMTP: {
     host: "mail.cgbengenharia.com.br",
     port: "587",
     user: "✅ Configurado",
     password: "✅ Configurado"
   }
   ```

**✅ Se aparecer:** Configuração está correta  
**❌ Se aparecer "❌ Não configurado":** Verifique as variáveis de ambiente

---

## 🧪 **Teste 2: Teste Manual via Console do Navegador**

1. Abra o portal: `https://vagas.grupocgb.com.br/admin`
2. Abra o Console do navegador (F12 → Console)
3. Cole e execute este código:

```javascript
fetch('https://SEU_PROJETO.supabase.co/functions/v1/send-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer SUA_ANON_KEY'
  },
  body: JSON.stringify({
    to: 'ti.belem@cgbengenharia.com.br',
    subject: '🧪 Teste de Email - Sistema CGB Vagas',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>✅ Teste de Email Funcionando!</h2>
        <p>Se você recebeu este email, o sistema está configurado corretamente.</p>
        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      </div>
    `
  })
})
.then(res => res.json())
.then(data => console.log('✅ Resposta:', data))
.catch(err => console.error('❌ Erro:', err));
```

**Substitua:**
- `SEU_PROJETO` → ID do seu projeto Supabase
- `SUA_ANON_KEY` → Chave anônima do Supabase (encontra em Settings → API)

**✅ Se retornar `success: true`:** Email foi enviado  
**❌ Se retornar erro:** Verifique os logs da Edge Function

---

## 🧪 **Teste 3: Teste Real - Criar Solicitação de Vaga**

### Passo a Passo:
1. Acesse: **Admin** → **Solicitações de Vagas**
2. Clique em **"Nova Solicitação"**
3. Preencha os dados:
   - Título: `Teste de Email - Vaga Teste`
   - Departamento: Qualquer um
   - Cidade/Estado: Qualquer um
   - Descrição: `Este é um teste do sistema de email`
4. Clique em **"Enviar Solicitação"**

### O que deve acontecer:
- ✅ Email deve ser enviado para **gerentes** da região/departamento
- ✅ Verifique a caixa de entrada dos gerentes
- ✅ Verifique também a pasta de **SPAM**

### Verificar Logs:
- Supabase Dashboard → Edge Functions → `send-email` → **Logs**
- Procure por: `✅ Email enviado com sucesso para: gerente@email.com`

---

## 🧪 **Teste 4: Teste Real - Reprovar Candidato**

### Passo a Passo:
1. Acesse: **Admin** → **Processo Seletivo**
2. Selecione uma vaga
3. Selecione um candidato
4. Clique em **"Reprovar"**
5. Preencha o motivo
6. Clique em **"Confirmar"**

### O que deve acontecer:
- ✅ Email deve ser enviado para **RH da região** e **Gerente do departamento**
- ✅ Email deve conter: Nome do candidato, Vaga, Motivo da reprovação

---

## 🧪 **Teste 5: Teste Real - Nova Candidatura**

### Passo a Passo:
1. Acesse: `https://vagas.grupocgb.com.br` (página pública)
2. Selecione uma vaga
3. Clique em **"Candidatar-se"**
4. Preencha o formulário
5. Envie a candidatura

### O que deve acontecer:
- ✅ Email deve ser enviado para **RH da região** e **Solicitador da vaga**
- ✅ Email deve conter: Nome do candidato, Vaga, Email do candidato

---

## 🔍 **Como Verificar se o Email Foi Enviado**

### 1. Verificar Logs da Edge Function:
```
Supabase Dashboard → Edge Functions → send-email → Logs
```

Procure por:
- `📧 Tentando enviar email para: email@exemplo.com`
- `✅ Conectado ao servidor SMTP`
- `✅ Email enviado com sucesso para: email@exemplo.com`

### 2. Verificar Caixa de Entrada:
- Verifique o email do destinatário
- **IMPORTANTE:** Verifique também a pasta de **SPAM/Lixo Eletrônico**

### 3. Verificar Erros:
Se aparecer erro nos logs:
- `❌ Erro ao enviar e-mail:` → Veja a mensagem de erro
- `535` → Problema de autenticação (usuário/senha)
- `timeout` → Problema de conexão (host/porta)
- `550/553` → Email rejeitado pelo servidor

---

## 🐛 **Troubleshooting**

### ❌ Email não chega, mas logs mostram sucesso
**Solução:**
1. Verifique pasta de SPAM
2. Verifique se o email do destinatário está correto
3. Verifique se o servidor SMTP não está bloqueando o envio

### ❌ Erro 535 (Autenticação falhou)
**Solução:**
1. Verifique se usuário e senha estão corretos
2. Verifique se não há espaços extras nas variáveis
3. Tente trocar a porta para 25

### ❌ Erro de conexão/timeout
**Solução:**
1. Verifique se `mail.cgbengenharia.com.br` está acessível
2. Tente trocar porta 587 para 25
3. Verifique firewall/rede

### ❌ Variáveis não configuradas
**Solução:**
1. Supabase Dashboard → Edge Functions → Secrets
2. Adicione as 4 variáveis:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`

---

## ✅ **Checklist de Testes**

Marque conforme testar:

- [ ] **Teste 1:** Configuração SMTP aparece nos logs
- [ ] **Teste 2:** Teste manual via console funciona
- [ ] **Teste 3:** Criar solicitação de vaga envia email para gerente
- [ ] **Teste 4:** Reprovar candidato envia email para RH/Gerente
- [ ] **Teste 5:** Nova candidatura envia email para RH/Solicitador
- [ ] **Verificação:** Emails chegam na caixa de entrada (não no spam)
- [ ] **Verificação:** Logs mostram sucesso em todos os envios

---

## 📊 **Status Esperado**

Após todos os testes, você deve ver nos logs:

```
📧 Configurações SMTP: { host: "mail.cgbengenharia.com.br", port: "587", ... }
📨 Requisição recebida: POST /functions/v1/send-email
📧 Tentando enviar email para: gerente@cgbengenharia.com.br
🔐 Conectando com TLS na porta 587...
✅ Conectado ao servidor SMTP
✅ Email enviado com sucesso para: gerente@cgbengenharia.com.br
```

**Se aparecer tudo isso:** ✅ Sistema funcionando perfeitamente!

---

## 🆘 **Precisa de Ajuda?**

Se algum teste falhar:
1. Copie os logs da Edge Function
2. Verifique qual teste falhou
3. Consulte a seção de Troubleshooting acima
