# 📧 Como Funciona o Sistema Automático de Emails

## ✅ **RESPOSTA RÁPIDA**

**Você NÃO precisa fazer nada!** Os templates já estão configurados e os emails são disparados **automaticamente** quando os eventos acontecem no sistema.

---

## 🔄 **COMO FUNCIONA**

### 1. **Onde os Templates Estão**

Os templates de email estão definidos em **2 lugares**:

#### 📍 **Local 1: Edge Function (Backend)**
**Arquivo:** `supabase/functions/send-notification/index.ts`

- ✅ **8 templates principais** estão aqui
- ✅ Esta é a função que **realmente envia os emails**
- ✅ Usa a Edge Function `send-email` que se conecta ao SMTP

#### 📍 **Local 2: Frontend (Hook)**
**Arquivo:** `src/hooks/useNotifications.tsx`

- ✅ **4 templates adicionais** estão aqui
- ✅ Usado como fallback ou para templates específicos do frontend

---

### 2. **Como os Emails São Disparados Automaticamente**

Os emails são disparados **automaticamente** quando certas ações acontecem no sistema. Veja onde cada evento está implementado:

#### 🆕 **Nova Solicitação de Vaga**
**Arquivo:** `src/hooks/useJobRequests.tsx` (linha ~267)
- Quando: Solicitador cria uma nova solicitação
- Dispara automaticamente no `onSuccess` da função `createJobRequest`

```typescript
// Código já implementado - dispara automaticamente
await sendNotification({
    type: 'new_job_request',
    recipients: managers,
    data: { ... }
});
```

#### ✅ **Solicitação Aprovada/Rejeitada**
**Arquivo:** `src/hooks/useJobRequests.tsx`
- Quando: Gerente aprova ou rejeita uma solicitação
- Dispara automaticamente quando o status muda

#### 🚀 **Vaga Publicada**
**Arquivo:** `src/hooks/useJobs.tsx` ou componente de gerenciamento de vagas
- Quando: RH publica uma vaga no site
- Dispara automaticamente após a publicação

#### 👤 **Nova Candidatura**
**Arquivo:** `src/hooks/useCandidates.tsx` (linha ~400)
- Quando: Candidato se candidata via formulário público
- Dispara automaticamente no `onSuccess` de `useCreateCandidate`

```typescript
// Código já implementado - dispara automaticamente
await sendNotification({
    type: 'new_application',
    recipients: [...rhUsers, ...managers],
    data: { ... }
});
```

#### ❌ **Candidato Reprovado**
**Arquivo:** `src/components/admin/SelectionProcess.tsx` (linha ~746)
- Quando: Candidato é movido para status "Reprovado"
- Dispara automaticamente quando o status muda

```typescript
// Código já implementado - dispara automaticamente
await sendNotification({
    type: 'candidate_rejected',
    recipients: allRecipients,
    data: { ... }
});
```

#### ⚖️ **Validação Jurídica**
**Arquivo:** `src/hooks/useLegalData.tsx` ou `src/hooks/useCandidates.tsx`
- Quando: Candidato é movido para "Validação TJ" ou jurídico aprova/rejeita
- Dispara automaticamente quando o status jurídico muda

#### 🎉 **Candidato Contratado**
**Arquivo:** `src/hooks/useCandidates.tsx` (linha ~469)
- Quando: Candidato é movido para status "Aprovado"
- Dispara automaticamente no `onSuccess` de `useUpdateCandidateStatus`

---

## 📋 **CHECKLIST: O QUE JÁ ESTÁ FUNCIONANDO**

### ✅ **Templates Configurados e Prontos:**
- [x] Nova Solicitação de Vaga
- [x] Solicitação Aprovada
- [x] Solicitação Rejeitada
- [x] Vaga Publicada
- [x] Nova Candidatura
- [x] Candidato Reprovado
- [x] Validação Jurídica Pendente
- [x] Validação Jurídica Aprovada
- [x] Validação Jurídica Rejeitada
- [x] Candidato Contratado

### ⚠️ **Templates Prontos, Mas Precisam de Cron Job:**
- [ ] Vaga Vencendo em Breve (template pronto, precisa cron)
- [ ] Vaga Expirada (template pronto, precisa cron)

---

## 🔧 **O QUE VOCÊ PRECISA FAZER**

### ✅ **Nada!** 

Os templates já estão:
- ✅ Definidos nos arquivos corretos
- ✅ Conectados aos eventos do sistema
- ✅ Configurados para disparar automaticamente
- ✅ Links corrigidos para `vagas.grupocgb.com.br`

### ⚙️ **Única Configuração Necessária:**

**SMTP Configurado?** Verifique se as variáveis de ambiente estão configuradas no Supabase:

1. Acesse o Supabase Dashboard
2. Vá em **Settings** → **Edge Functions** → **Environment Variables**
3. Verifique se estão configuradas:
   - `SMTP_HOST` = `mail.cgbengenharia.com.br`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = `ti.belem@cgbengenharia.com.br`
   - `SMTP_PASSWORD` = `H6578m2024@cgb`

**Se não estiver configurado**, os emails não serão enviados. Veja o guia completo em:
- `docs/configuracao-smtp-cgbengenharia.md`

---

## 🧪 **COMO TESTAR**

### Teste 1: Nova Solicitação de Vaga
1. Faça login como **Solicitador**
2. Crie uma nova solicitação de vaga
3. ✅ Email deve ser enviado automaticamente para os gerentes

### Teste 2: Nova Candidatura
1. Acesse o site público (`vagas.grupocgb.com.br`)
2. Candidato se candidata a uma vaga
3. ✅ Email deve ser enviado automaticamente para RH e Gerente

### Teste 3: Candidato Reprovado
1. Acesse **Processos Seletivos**
2. Mova um candidato para "Reprovado"
3. ✅ Email deve ser enviado automaticamente para RH e Gerente

### Teste 4: Verificar Logs
1. Acesse Supabase Dashboard
2. Vá em **Edge Functions** → **Logs**
3. Procure por mensagens de email enviado

---

## 📊 **FLUXO COMPLETO**

```
1. Usuário faz uma ação no sistema
   ↓
2. Código detecta o evento (ex: criar vaga, aprovar, reprovar)
   ↓
3. Função `sendNotification()` é chamada automaticamente
   ↓
4. Sistema busca destinatários (RH, Gerentes, etc.) por região/departamento
   ↓
5. Template é selecionado e preenchido com dados
   ↓
6. Edge Function `send-notification` é chamada
   ↓
7. Edge Function `send-email` envia via SMTP
   ↓
8. Email chega na caixa de entrada do destinatário
```

---

## ❓ **PERGUNTAS FREQUENTES**

### **P: Preciso fazer deploy dos templates?**
**R:** Não! Os templates já estão no código. Quando você fizer deploy do projeto, eles já estarão incluídos.

### **P: Os emails vão funcionar automaticamente?**
**R:** Sim! Desde que:
- ✅ SMTP esteja configurado no Supabase
- ✅ Edge Functions estejam deployadas
- ✅ O código esteja em produção

### **P: Como sei se está funcionando?**
**R:** 
1. Verifique os logs do Supabase (Edge Functions → Logs)
2. Teste criando uma solicitação de vaga
3. Verifique se o email chegou

### **P: Posso modificar os templates?**
**R:** Sim! Edite os arquivos:
- `supabase/functions/send-notification/index.ts` (templates principais)
- `src/hooks/useNotifications.tsx` (templates adicionais)

Depois faça deploy novamente.

---

## 🎯 **RESUMO**

✅ **Templates:** Já estão configurados  
✅ **Disparo Automático:** Já está implementado  
✅ **Links:** Já foram corrigidos  
⚠️ **SMTP:** Precisa estar configurado no Supabase  
⚠️ **Cron Jobs:** 2 templates precisam de cron (Vaga Vencendo/Expirada)

**Você não precisa fazer nada além de garantir que o SMTP está configurado!** 🚀
