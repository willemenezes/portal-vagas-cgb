# 📧 Configuração SMTP - CGB Engenharia

## ✅ **Dados de Configuração**

Use estes valores nas variáveis de ambiente do Supabase:

### Variáveis de Ambiente (Supabase Dashboard → Edge Functions → Secrets):

```
SMTP_HOST=mail.cgbengenharia.com.br
SMTP_PORT=587
SMTP_USER=ti.belem@cgbengenharia.com.br
SMTP_PASSWORD=H6578m2024@cgb
```

---

## 🔧 **Como Configurar no Supabase**

### Passo 1: Acessar Configurações
1. Acesse: **Supabase Dashboard**
2. Vá em: **Project Settings** → **Edge Functions**
3. Clique em: **Secrets** (ou **Environment Variables**)

### Passo 2: Adicionar Variáveis
Clique em **"Add new secret"** e adicione cada uma:

1. **Nome:** `SMTP_HOST`
   **Valor:** `mail.cgbengenharia.com.br`

2. **Nome:** `SMTP_PORT`
   **Valor:** `587`

3. **Nome:** `SMTP_USER`
   **Valor:** `ti.belem@cgbengenharia.com.br`

4. **Nome:** `SMTP_PASSWORD`
   **Valor:** `H6578m2024@cgb`

### Passo 3: Verificar
Após adicionar todas as 4 variáveis, você deve ver:
- ✅ SMTP_HOST
- ✅ SMTP_PORT
- ✅ SMTP_USER
- ✅ SMTP_PASSWORD

---

## ⚠️ **Notas Importantes**

### Porta 587 vs 110
- **Porta 587**: SMTP com STARTTLS (envio de emails) ✅ **USE ESTA**
- **Porta 110**: POP3 (recebimento de emails) ❌ Não use para envio

### Criptografia
- A porta **587** geralmente usa **STARTTLS** (criptografia opcional)
- O código detecta automaticamente e usa TLS quando necessário
- Se a porta 587 não funcionar, tente **porta 25** (sem criptografia)

---

## 🧪 **Testar Configuração**

Após configurar, teste enviando um email:

1. Acesse qualquer funcionalidade que envia email (ex: criar solicitação de vaga)
2. Verifique os logs da Edge Function:
   - Supabase Dashboard → Edge Functions → `send-email` → **Logs**
3. Procure por:
   - `✅ Configurado` nas configurações SMTP
   - `✅ Conectado ao servidor SMTP`
   - `✅ Email enviado com sucesso`

---

## 🔍 **Troubleshooting**

### ❌ Erro 535 (Autenticação falhou)
- Verifique se o usuário e senha estão corretos
- Verifique se não há espaços extras nas variáveis

### ❌ Erro de conexão/timeout
- Verifique se `mail.cgbengenharia.com.br` está acessível
- Tente trocar porta 587 para 25
- Verifique firewall/rede

### ❌ Email não chega
- Verifique pasta de SPAM
- Verifique logs da Edge Function
- Confirme que o servidor SMTP está funcionando

---

## 📝 **Alternativa: Porta 25 (Sem Criptografia)**

Se a porta 587 não funcionar, tente porta 25:

```
SMTP_PORT=25
```

O código detecta automaticamente e usa conexão sem TLS.

---

**Status:** ✅ Código atualizado e pronto para usar com estas configurações!
