# 🔧 Correção do Problema do FormSubmit - Guia de Deploy

## ⚠️ **PROBLEMA IDENTIFICADO**

Você está recebendo emails do FormSubmit porque o código **ainda não foi deployado em produção**. O código local foi corrigido, mas o servidor ainda está usando a versão antiga.

---

## ✅ **O QUE FOI CORRIGIDO**

### **Arquivo:** `src/hooks/useNotifications.tsx`

**ANTES (Código Antigo - Ainda em Produção):**
```typescript
// ❌ Usava sendEmailDirect que tentava FormSubmit/Web3Forms
const result = await sendEmailDirect(recipient.email, subject, html);
```

**DEPOIS (Código Novo - Local):**
```typescript
// ✅ Agora usa Edge Function send-notification com SMTP direto
const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`
  },
  body: JSON.stringify({
    type,
    recipients: validRecipients,
    data
  })
});
```

---

## 🚀 **COMO RESOLVER**

### **Opção 1: Deploy via Git (Recomendado)**

1. **Commitar as alterações:**
```bash
git add src/hooks/useNotifications.tsx
git commit -m "Corrigir: Remover FormSubmit e usar Edge Function com SMTP direto"
git push
```

2. **Deploy automático:**
   - Se você usa Vercel/Netlify, o deploy acontece automaticamente após o push
   - Aguarde alguns minutos para o deploy completar

3. **Verificar deploy:**
   - Acesse o painel do Vercel/Netlify
   - Confirme que o deploy foi concluído com sucesso

### **Opção 2: Deploy Manual (Se necessário)**

1. **Build do projeto:**
```bash
npm run build
```

2. **Deploy do build:**
   - Faça upload da pasta `dist` para seu servidor
   - Ou use o método de deploy do seu provedor

---

## 🔍 **VERIFICAR SE ESTÁ FUNCIONANDO**

### **Teste 1: Verificar Console do Navegador**

1. Abra o site em produção
2. Abra o Console do navegador (F12)
3. Crie uma nova solicitação de vaga
4. Procure por esta mensagem no console:
   ```
   📧 Enviando notificação new_job_request para X destinatário(s)
   ```

### **Teste 2: Verificar Logs do Supabase**

1. Acesse o Supabase Dashboard
2. Vá em **Edge Functions** → **Logs**
3. Procure por chamadas para `send-notification`
4. Verifique se há erros ou se está funcionando

### **Teste 3: Testar Envio de Email**

1. Crie uma nova solicitação de vaga
2. Verifique se o email chega **SEM** ser do FormSubmit
3. O email deve vir de `naoresponda@grupocgb.com.br`

---

## ⚙️ **VERIFICAR CONFIGURAÇÃO DO SMTP**

Antes de fazer deploy, certifique-se de que o SMTP está configurado no Supabase:

1. Acesse **Supabase Dashboard**
2. Vá em **Settings** → **Edge Functions** → **Environment Variables**
3. Verifique se estão configuradas:
   - `SMTP_HOST` = `mail.cgbengenharia.com.br`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = `ti.belem@cgbengenharia.com.br`
   - `SMTP_PASSWORD` = `H6578m2024@cgb`

**Se não estiver configurado, os emails não serão enviados!**

---

## 📋 **CHECKLIST DE DEPLOY**

- [ ] Código corrigido localmente (`src/hooks/useNotifications.tsx`)
- [ ] Alterações commitadas no Git
- [ ] Push feito para o repositório
- [ ] Deploy automático iniciado (Vercel/Netlify)
- [ ] Deploy concluído com sucesso
- [ ] SMTP configurado no Supabase
- [ ] Edge Function `send-notification` deployada
- [ ] Edge Function `send-email` deployada
- [ ] Teste realizado e emails chegando corretamente

---

## 🎯 **RESULTADO ESPERADO**

Após o deploy:

✅ **NÃO** receberá mais emails do FormSubmit  
✅ Emails serão enviados via SMTP direto da CGB  
✅ Emails virão de `naoresponda@grupocgb.com.br`  
✅ Templates funcionarão normalmente  

---

## ⚠️ **IMPORTANTE**

**Os emails do FormSubmit vão parar assim que o código novo for deployado em produção.**

Se você ainda receber emails do FormSubmit após o deploy:
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Verifique se o deploy foi concluído
3. Verifique os logs do Supabase para erros
4. Confirme que o SMTP está configurado corretamente

---

## 📞 **SUPORTE**

Se o problema persistir após o deploy:
- Verifique os logs do Supabase (Edge Functions → Logs)
- Verifique o console do navegador para erros
- Confirme que as variáveis de ambiente estão corretas
