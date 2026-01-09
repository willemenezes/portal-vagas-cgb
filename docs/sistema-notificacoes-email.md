# Sistema de Notificações por Email - CGB VAGAS

## 📊 **ANÁLISE ATUAL DO SISTEMA**

### ✅ **O que JÁ está implementado:**

#### 1. Infraestrutura Base
- ✅ Hook `useNotifications` funcional
- ✅ Templates de email profissionais
- ✅ Edge Function `send-email` com SMTP
- ✅ Sistema de fallback (Web3Forms + Formsubmit)
- ✅ Funções para buscar destinatários por região/departamento

#### 2. Perfis com Controle Regional
- ✅ `assigned_states`: Estados atribuídos ao perfil
- ✅ `assigned_cities`: Cidades atribuídas ao perfil
- ✅ `assigned_departments`: Departamentos atribuídos (gerentes)
- ✅ Funções `getManagersByRegion()`, `getRHByRegion()`, etc.

#### 3. Notificações JÁ Implementadas

| Evento | Quando | Destinatário | Status |
|--------|--------|--------------|--------|
| Nova Solicitação de Vaga | Solicitador cria vaga | Gerentes da região/departamento | ✅ Implementado |
| Solicitação Aprovada | Gerente aprova | Solicitador + RH da região | ✅ Implementado |
| Solicitação Rejeitada | Gerente rejeita | Solicitador | ✅ Implementado |
| Vaga Publicada | RH publica vaga | Solicitador + Gerente | ✅ Implementado |
| Validação Jurídica Pendente | Candidato → Validação TJ | Jurídicos | ✅ Implementado |
| Validação Aprovada | Jurídico aprova | RH da região | ✅ Implementado |
| Validação Rejeitada | Jurídico rejeita | RH da região | ✅ Implementado |
| Candidato Contratado | Status → Aprovado | RH da região | ✅ Implementado |

---

## ❌ **O que FALTA implementar:**

### Eventos Importantes sem Notificação:

| Evento | Quando | Destinatário Sugerido | Prioridade |
|--------|--------|----------------------|------------|
| Candidato Reprovado | Status → Reprovado | RH da região + Gerente do departamento | 🔴 Alta |
| Movimentação de Etapa | Candidato muda de fase | RH da região | 🟡 Média |
| Candidato se Candidata | Nova candidatura | RH da região + Solicitador da vaga | 🟡 Média |
| Vaga Próxima do Vencimento | 5 dias antes de expirar | RH + Gerente responsável | 🔴 Alta |
| Vaga Expirada | Vaga vence | RH + Gerente responsável | 🔴 Alta |
| Quantidade de Vagas Esgotada | Última vaga preenchida | RH + Gerente + Solicitador | 🟡 Média |
| Solicitação Excluída | Solicitador/Admin deleta | Gerente que aprovou (se houver) | 🟢 Baixa |

---

## 🎯 **RECOMENDAÇÕES E MELHORIAS**

### 1. **Configurações de Notificação por Perfil**
Permitir que cada usuário escolha quais notificações quer receber:
- ✉️ Todas as notificações
- 🔔 Apenas urgentes
- 🔕 Nenhuma (desabilitar)

### 2. **Templates Adicionais Necessários**

#### 🔴 Template: `candidate_rejected`
```
Assunto: ❌ Candidato Reprovado - {{candidateName}}
Destinatário: RH da região + Gerente do departamento
Quando: Candidato movido para "Reprovado"
```

#### 🔴 Template: `job_expiring_soon`
```
Assunto: ⏰ Vaga Vencendo em Breve - {{jobTitle}}
Destinatário: RH + Gerente + Solicitador
Quando: 5 dias antes de expirar
```

#### 🔴 Template: `job_expired`
```
Assunto: 🚨 Vaga Expirada - {{jobTitle}}
Destinatário: RH + Gerente + Solicitador
Quando: Vaga expira
```

#### 🟡 Template: `new_application`
```
Assunto: 👤 Nova Candidatura - {{candidateName}} para {{jobTitle}}
Destinatário: RH da região + Solicitador
Quando: Candidato se candidata
```

#### 🟡 Template: `candidate_status_change`
```
Assunto: 🔄 Candidato Avançou - {{candidateName}}
Destinatário: RH da região
Quando: Candidato muda de etapa importante
```

### 3. **Sistema de Digest (Resumo Diário)**
- Enviar um email diário com resumo de atividades
- Evita spam de muitos emails individuais
- Pode ser configurável (diário, semanal)

### 4. **Logs de Notificações**
Criar tabela `notification_logs`:
- ID da notificação
- Tipo
- Destinatários
- Status (enviado/falhou)
- Data/hora
- Erro (se houver)

---

## 🚀 **IMPLEMENTAÇÃO PROPOSTA**

### Passo 1: Adicionar Templates Faltantes
Adicionar novos templates em `useNotifications.tsx`

### Passo 2: Implementar Notificações nos Eventos
- Adicionar `sendNotification` em:
  - `SelectionProcess.tsx` (reprovação)
  - `JobManagement.tsx` (expiração)
  - Outros componentes relevantes

### Passo 3: Sistema de Agendamento
- Criar Edge Function para verificar vagas expirando
- Executar diariamente via Supabase Cron

### Passo 4: Tabela de Logs
- Migração SQL para criar `notification_logs`
- Salvar histórico de envios

---

## 📝 **PRÓXIMOS PASSOS**

Deseja que eu:
1. ✅ Implemente os templates faltantes?
2. ✅ Adicione notificações nos eventos prioritários?
3. ✅ Crie o sistema de logs?
4. ✅ Configure verificação automática de vencimento?

**Aguardando sua aprovação para prosseguir com a implementação.**
