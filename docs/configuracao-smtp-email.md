# 📧 Guia de Configuração SMTP - Sistema de Emails CGB VAGAS

## 🎯 **Objetivo**
Configurar o serviço de email para que o sistema envie notificações automáticas para os perfis envolvidos em cada etapa do processo de recrutamento.

---

## ✅ **Notificações JÁ Implementadas (Aguardando Configuração SMTP)**

### Fluxo de Vagas
- ✅ Nova solicitação de vaga → Gerentes da região/departamento
- ✅ Solicitação aprovada → Solicitador + RH da região
- ✅ Solicitação rejeitada → Solicitador
- ✅ Vaga publicada → Solicitador + Gerente
- ✅ Vaga próxima de vencer (5 dias) → RH + Gerente + Solicitador
- ✅ Vaga expirada → RH + Gerente + Solicitador

### Fluxo de Candidatos
- ✅ Nova candidatura → RH da região + Gerente do departamento
- ✅ Candidato reprovado → RH da região + Gerente do departamento
- ✅ Candidato → Validação TJ → Jurídicos
- ✅ Validação jurídica aprovada → RH da região
- ✅ Validação jurídica rejeitada → RH da região
- ✅ Candidato contratado → RH da região

---

## 🔧 **CONFIGURAÇÃO SMTP**

### Opção 1: Gmail (Recomendado para testes)

#### Passo 1: Criar Senha de App no Gmail
1. Acesse: https://myaccount.google.com/security
2. Ative a verificação em duas etapas (se ainda não tiver)
3. Vá em "Senhas de app"
4. Selecione "Email" e "Outro (nome personalizado)"
5. Digite: `CGB Portal Vagas`
6. Copie a senha gerada (16 caracteres)

#### Passo 2: Configurar Variáveis de Ambiente no Supabase

Acesse o Supabase Dashboard:
1. Vá em **Project Settings** → **Edge Functions**
2. Adicione as seguintes variáveis:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=seuemail@gmail.com
SMTP_PASSWORD=sua_senha_de_app_16_caracteres
```

**⚠️ IMPORTANTE:**
- Use a senha de app gerada, NÃO sua senha normal do Gmail
- A senha tem 16 caracteres sem espaços
- Porta 465 para SSL/TLS

---

### Opção 2: Office 365 / Outlook

```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=seuemail@cgbengenharia.com.br
SMTP_PASSWORD=sua_senha
```

---

### Opção 3: SMTP Dedicado (Recomendado para Produção)

#### Serviços Recomendados:

**SendGrid** (Gratuito até 100 emails/dia)
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=sua_api_key_do_sendgrid
```

**Mailgun** (Gratuito até 5000 emails/mês primeiro ano)
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@seu-dominio.mailgun.org
SMTP_PASSWORD=sua_senha_mailgun
```

**Amazon SES** (Mais barato para alto volume)
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=sua_access_key
SMTP_PASSWORD=sua_secret_key
```

---

## 🚀 **IMPLANTAÇÃO - PASSO A PASSO**

### 1. Configurar SMTP no Supabase

```bash
# Via Supabase CLI (se tiver instalado)
supabase secrets set SMTP_HOST=smtp.gmail.com
supabase secrets set SMTP_PORT=465
supabase secrets set SMTP_USER=seuemail@gmail.com
supabase secrets set SMTP_PASSWORD=sua_senha_app
```

**OU via Dashboard:**
- Project Settings → Edge Functions → Secrets
- Adicionar cada variável manualmente

### 2. Verificar Edge Function `send-email`

A função já está criada em: `supabase/functions/send-email/index.ts`

Para atualizar/reimplantar:
```bash
supabase functions deploy send-email
```

### 3. Testar Envio de Email

Teste manual via terminal:
```bash
curl -i --location --request POST 'https://SEU_PROJETO.supabase.co/functions/v1/send-email' \
  --header 'Authorization: Bearer SUA_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"to":"seuemail@teste.com","subject":"Teste","html":"<h1>Teste</h1>"}'
```

---

## 🔍 **VERIFICAÇÃO E TROUBLESHOOTING**

### Verificar se as variáveis estão configuradas:
1. Supabase Dashboard → Project Settings → Edge Functions
2. Verificar se as 4 variáveis SMTP aparecem

### Logs da Edge Function:
```bash
supabase functions logs send-email
```

### Problemas Comuns:

#### ❌ "535 Authentication failed"
**Solução:** Verifique se está usando senha de app (não senha normal do Gmail)

#### ❌ "Connection timeout"
**Solução:** Verifique firewall ou tente trocar porta (465 ↔ 587)

#### ❌ "SMTP not configured"
**Solução:** As variáveis de ambiente não foram definidas

#### ❌ Emails não chegam (sem erro)
**Solução:** Verifique pasta de SPAM do destinatário

---

## 📊 **MONITORAMENTO**

### Verificar Emails Enviados

O sistema registra logs no console sempre que tenta enviar um email:
```
📧 Enviando notificação new_job_request para 2 destinatário(s)
✅ Email enviado para gerente@cgb.com.br
✅ Notificação new_job_request processada: 2/2 emails enviados
```

### Fallback Automático

Se o SMTP falhar, o sistema tenta:
1. **Web3Forms** (serviço externo gratuito)
2. **Formsubmit** (serviço externo gratuito)
3. **Link mailto** (último recurso - abre cliente de email)

---

## 🎨 **PERSONALIZAÇÃO**

### Alterar Remetente Padrão

Edite `supabase/functions/send-email/index.ts`:
```typescript
from: `"CGB Energia RH" <naoresponda@cgbengenharia.com.br>`,
```

### Personalizar Templates

Edite `src/hooks/useNotifications.tsx`:
- Adicionar novo template em `EMAIL_TEMPLATES`
- Usar placeholders: `{{nomeVariavel}}`

### Desabilitar Notificações (Temporário)

Em `src/hooks/useNotifications.tsx`, adicione no início da função:
```typescript
if (true) return { success: true }; // Desabilita temporariamente
```

---

## ✉️ **TESTE RÁPIDO APÓS CONFIGURAÇÃO**

1. Cadastrar um novo perfil RH com seu email
2. Criar uma nova solicitação de vaga
3. Verificar se recebeu o email de notificação
4. Se não receber:
   - Verificar spam
   - Verificar logs: `supabase functions logs send-email`
   - Verificar se SMTP está configurado

---

## 📝 **CONFIGURAÇÃO RECOMENDADA PARA PRODUÇÃO**

```
Email Dedicado: naoresponda@cgbvagas.com.br
Servidor SMTP: SendGrid ou Amazon SES
Limite Diário: Mínimo 500 emails/dia
Autenticação: DKIM + SPF configurados no domínio
Monitoramento: Configurar alertas para falhas
```

---

## 🆘 **SUPORTE**

Caso tenha dúvidas ou problemas:
1. Verificar logs da Edge Function
2. Testar com `curl` (comando acima)
3. Verificar console do navegador (F12)
4. Logs aparecem como `📧` e `✅` no console

---

**Status Atual:** ✅ Sistema implementado e pronto para funcionar assim que SMTP for configurado.
