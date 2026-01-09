# 📧 Eventos que Disparam Emails - Sistema CGB VAGAS

## 📊 **Resumo Completo de Todas as Notificações por Email**

---

## 🎯 **FLUXO DE VAGAS**

### 1. **Nova Solicitação de Vaga** 🆕
**Quando:** Solicitador cria uma nova solicitação de vaga  
**Destinatários:**
- ✅ **Gerentes** da região/departamento da vaga
  - Filtro: `assigned_states` e `assigned_cities` devem incluir a região da vaga
  - Filtro: `assigned_departments` deve incluir o departamento da vaga (se configurado)

**Template:** `new_job_request`  
**Conteúdo:**
- Título da vaga
- Departamento
- Localização (cidade, estado)
- Nome do solicitador
- Link para revisar no portal

---

### 2. **Solicitação Aprovada** ✅
**Quando:** Gerente aprova uma solicitação de vaga  
**Destinatários:**
- ✅ **Solicitador** que criou a vaga
- ✅ **RH** da região da vaga
  - Filtro: `assigned_states` e `assigned_cities` devem incluir a região da vaga

**Template:** `job_request_approved`  
**Conteúdo:**
- Título da vaga
- Departamento
- Localização
- Nome do gerente que aprovou
- Observações (se houver)
- Link para acessar o portal

---

### 3. **Solicitação Rejeitada** ❌
**Quando:** Gerente rejeita uma solicitação de vaga  
**Destinatários:**
- ✅ **Solicitador** que criou a vaga

**Template:** `job_request_rejected`  
**Conteúdo:**
- Título da vaga
- Departamento
- Localização
- Nome do gerente que rejeitou
- Motivo da rejeição
- Link para acessar o portal

---

### 4. **Vaga Publicada** 🚀
**Quando:** RH publica uma vaga aprovada no site  
**Destinatários:**
- ✅ **Solicitador** que criou a vaga
- ✅ **Gerente** que aprovou a vaga

**Template:** `job_published`  
**Conteúdo:**
- Título da vaga
- Departamento
- Localização
- Nome de quem publicou
- Link para ver candidaturas

---

### 5. **Vaga Vencendo em Breve** ⏰
**Quando:** Vaga está a 5 dias úteis do vencimento  
**Destinatários:**
- ✅ **RH** da região da vaga
- ✅ **Gerente** responsável pela vaga
- ✅ **Solicitador** que criou a vaga

**Template:** `job_expiring_soon`  
**Conteúdo:**
- Título da vaga
- Departamento
- Localização
- Dias restantes até vencimento
- Quantidade de vagas restantes
- Link para gerenciar a vaga

**Status:** ⚠️ **Ainda não implementado automaticamente** (precisa de cron job)

---

### 6. **Vaga Expirada** 🚨
**Quando:** Vaga atinge a data de vencimento  
**Destinatários:**
- ✅ **RH** da região da vaga
- ✅ **Gerente** responsável pela vaga
- ✅ **Solicitador** que criou a vaga

**Template:** `job_expired`  
**Conteúdo:**
- Título da vaga
- Departamento
- Localização
- Data de vencimento
- Quantidade de vagas restantes
- Link para reativar a vaga

**Status:** ⚠️ **Ainda não implementado automaticamente** (precisa de cron job)

---

## 👤 **FLUXO DE CANDIDATOS**

### 7. **Nova Candidatura** 👤
**Quando:** Candidato se candidata a uma vaga (formulário público)  
**Destinatários:**
- ✅ **RH** da região da vaga
  - Filtro: `assigned_states` e `assigned_cities` devem incluir a região da vaga
- ✅ **Gerente/Solicitador** do departamento da vaga
  - Filtro: `assigned_departments` deve incluir o departamento da vaga

**Template:** `new_application`  
**Conteúdo:**
- Nome do candidato
- Email do candidato
- Vaga para qual se candidatou
- Departamento
- Localização
- Data da candidatura
- Link para ver candidatos

**Observação:** Não envia para candidaturas manuais (movimentação do Banco de Talentos)

---

### 8. **Candidato Reprovado** ❌
**Quando:** Candidato é movido para status "Reprovado" no processo seletivo  
**Destinatários:**
- ✅ **RH** da região da vaga
  - Filtro: `assigned_states` e `assigned_cities` devem incluir a região da vaga
- ✅ **Gerente** do departamento da vaga
  - Filtro: `assigned_departments` deve incluir o departamento da vaga

**Template:** `candidate_rejected`  
**Conteúdo:**
- Nome do candidato
- Vaga
- Departamento
- Localização
- Motivo da reprovação
- Data da reprovação
- Link para ver processo seletivo

---

### 9. **Validação Jurídica Pendente** ⚖️
**Quando:** Candidato é movido para etapa "Validação TJ"  
**Destinatários:**
- ✅ **Jurídicos** (todos os usuários com role `juridico`)

**Template:** `candidate_legal_validation`  
**Conteúdo:**
- Nome do candidato
- Email do candidato
- Vaga
- Localização
- Link para validar no portal

---

### 10. **Validação Jurídica Aprovada** ✅
**Quando:** Jurídico aprova a validação de um candidato  
**Destinatários:**
- ✅ **RH** da região da vaga
  - Filtro: `assigned_states` e `assigned_cities` devem incluir a região da vaga

**Template:** `legal_validation_approved`  
**Conteúdo:**
- Nome do candidato
- Vaga
- Status: Aprovado pelo Jurídico
- Observações (se houver)
- Link para ver processo

---

### 11. **Validação Jurídica Rejeitada** ❌
**Quando:** Jurídico rejeita a validação de um candidato  
**Destinatários:**
- ✅ **RH** da região da vaga
  - Filtro: `assigned_states` e `assigned_cities` devem incluir a região da vaga

**Template:** `legal_validation_rejected`  
**Conteúdo:**
- Nome do candidato
- Vaga
- Status: Rejeitado pelo Jurídico
- Motivo da rejeição
- Link para ver processo

---

### 12. **Candidato Contratado** 🎉
**Quando:** Candidato é movido para status "Aprovado" (contratado)  
**Destinatários:**
- ✅ **RH** da região da vaga
  - Filtro: `assigned_states` e `assigned_cities` devem incluir a região da vaga

**Template:** `candidate_hired`  
**Conteúdo:**
- Nome do candidato
- Vaga
- Departamento
- Localização
- Link para ver contratados

---

## 📋 **TABELA RESUMO**

| # | Evento | Quando | Destinatários | Status |
|---|--------|--------|---------------|--------|
| 1 | Nova Solicitação de Vaga | Solicitador cria vaga | Gerentes da região/departamento | ✅ Ativo |
| 2 | Solicitação Aprovada | Gerente aprova | Solicitador + RH da região | ✅ Ativo |
| 3 | Solicitação Rejeitada | Gerente rejeita | Solicitador | ✅ Ativo |
| 4 | Vaga Publicada | RH publica vaga | Solicitador + Gerente | ✅ Ativo |
| 5 | Vaga Vencendo em Breve | 5 dias antes de vencer | RH + Gerente + Solicitador | ⚠️ Template pronto, precisa cron |
| 6 | Vaga Expirada | Vaga vence | RH + Gerente + Solicitador | ⚠️ Template pronto, precisa cron |
| 7 | Nova Candidatura | Candidato se candidata | RH da região + Gerente/Solicitador | ✅ Ativo |
| 8 | Candidato Reprovado | Candidato reprovado | RH da região + Gerente | ✅ Ativo |
| 9 | Validação Jurídica Pendente | Candidato → Validação TJ | Jurídicos | ✅ Ativo |
| 10 | Validação Jurídica Aprovada | Jurídico aprova | RH da região | ✅ Ativo |
| 11 | Validação Jurídica Rejeitada | Jurídico rejeita | RH da região | ✅ Ativo |
| 12 | Candidato Contratado | Candidato aprovado | RH da região | ✅ Ativo |

---

## 🔍 **COMO FUNCIONA A FILTRAGEM DE DESTINATÁRIOS**

### Para Gerentes:
1. Verifica se o **estado** da vaga está em `assigned_states`
2. Se tiver estados, verifica se a **cidade** está em `assigned_cities` (se configurado)
3. Verifica se o **departamento** está em `assigned_departments` (se configurado)
4. Se `assigned_departments` for `NULL`, tem acesso a todos os departamentos

### Para RH (Recruiters):
1. Verifica se o **estado** da vaga está em `assigned_states`
2. Se tiver estados, verifica se a **cidade** está em `assigned_cities` (se configurado)
3. Admins recebem todas as notificações (sem filtro regional)

### Para Jurídicos:
- Recebem **TODAS** as validações jurídicas (sem filtro regional)

### Para Solicitadores:
- Recebem notificações sobre **suas próprias vagas** (que criaram)

---

## 📊 **ESTATÍSTICAS**

**Total de Templates:** 12  
**Templates Ativos:** 10  
**Templates Aguardando Cron:** 2 (Vaga Vencendo + Vaga Expirada)

**Eventos por Perfil:**
- **Gerentes:** 5 eventos (Nova solicitação, Aprovada, Publicada, Vencendo, Expirada)
- **RH:** 7 eventos (Aprovada, Publicada, Nova candidatura, Reprovado, Validação aprovada/rejeitada, Contratado, Vencendo, Expirada)
- **Solicitadores:** 4 eventos (Aprovada, Rejeitada, Publicada, Vencendo, Expirada)
- **Jurídicos:** 1 evento (Validação pendente)

---

## ⚙️ **CONFIGURAÇÃO NECESSÁRIA**

Para que os emails funcionem, é necessário:

1. ✅ **Edge Function `send-email`** configurada com SMTP
2. ✅ **Edge Function `send-notification`** atualizada
3. ✅ **Variáveis SMTP** configuradas no Supabase
4. ⚠️ **Cron Job** para vagas vencendo/expiradas (ainda não implementado)

---

## 🎯 **PRÓXIMOS PASSOS**

Para completar o sistema:
1. Implementar cron job para verificar vagas vencendo (5 dias antes)
2. Implementar cron job para verificar vagas expiradas
3. Adicionar logs de notificações enviadas
4. Criar dashboard de notificações (opcional)

---

**Última atualização:** Janeiro 2025  
**Status:** ✅ Sistema 83% completo (10/12 eventos ativos)
