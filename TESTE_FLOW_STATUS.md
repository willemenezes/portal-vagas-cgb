# 🧪 Plano de Testes - Flow Status

## ✅ O que foi implementado

Sistema de **cascata de status** para vagas quando candidatos são aprovados, com controle de visibilidade no site público.

---

## 🔧 Pré-requisitos para Testar

### 1. Aplicar a Migração no Banco

**ANTES DE TESTAR**, executar no Supabase SQL Editor:

```sql
-- Verificar se a migração foi aplicada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs' AND column_name = 'flow_status';

-- Se retornar vazio, aplicar a migração do arquivo:
-- supabase/migrations/20250130_add_job_flow_status.sql
```

### 2. Verificar se as vagas existentes foram atualizadas

```sql
-- Todas as vagas devem ter flow_status = 'ativa'
SELECT id, title, flow_status FROM jobs LIMIT 10;
```

---

## 📝 Casos de Teste

### TESTE 1: Modal de Aprovação ✅

**Objetivo**: Verificar se o modal aparece quando candidato é aprovado

**Passos**:
1. Login como RH Admin ou Recruiter
2. Navegar para **Processos Seletivos**
3. Selecionar uma vaga que tenha candidatos
4. Arrastar um candidato de qualquer coluna para **"Aprovado"**

**Resultado Esperado**:
- ✅ Modal aparece com título "Candidato Aprovado!"
- ✅ Modal mostra o nome do candidato
- ✅ Modal mostra 3 opções: Ativa, Concluída, Congelada
- ✅ Cada opção tem descrição clara

---

### TESTE 2: Atualização do Status da Vaga ✅

**Objetivo**: Verificar se o flow_status é atualizado corretamente

**Passos**:
1. No modal de aprovação, selecionar **"Concluída"**
2. Clicar em **"Confirmar"**
3. Aguardar notificação de sucesso
4. Navegar para **Gestão Completa de Vagas**

**Resultado Esperado**:
- ✅ Candidato aparece na coluna "Aprovado"
- ✅ Vaga mostra badge "✓ Concluída" na coluna Status
- ✅ Toast de sucesso aparece

---

### TESTE 3: Visibilidade no Site Público - Vaga Concluída ❌

**Objetivo**: Verificar se vaga concluída NÃO aparece no site público

**Passos**:
1. No admin, marcar uma vaga como **"Concluída"** (via aprovação de candidato)
2. Abrir uma **janela anônima** do navegador
3. Acessar o site público: `www.cgbvagas.com.br`
4. Buscar pela vaga que foi marcada como concluída

**Resultado Esperado**:
- ❌ A vaga **NÃO deve aparecer** na lista pública
- ❌ A vaga **NÃO deve aparecer** no mapa
- ❌ A vaga **NÃO deve aparecer** nas vagas em destaque

---

### TESTE 4: Visibilidade no Site Público - Vaga Congelada ❌

**Objetivo**: Verificar se vaga congelada NÃO aparece no site público

**Passos**:
1. No admin, editar uma vaga existente
2. No formulário, alterar **"Status de Visibilidade"** para **"Congelada"**
3. Salvar
4. Abrir janela anônima e acessar site público

**Resultado Esperado**:
- ❌ A vaga **NÃO deve aparecer** no site público

---

### TESTE 5: Visibilidade no Site Público - Vaga Ativa ✅

**Objetivo**: Verificar se vaga ativa aparece normalmente

**Passos**:
1. No admin, editar uma vaga
2. No formulário, alterar **"Status de Visibilidade"** para **"Ativa"**
3. Salvar
4. Acessar site público

**Resultado Esperado**:
- ✅ A vaga **DEVE aparecer** na lista pública
- ✅ A vaga **DEVE aparecer** no mapa
- ✅ A vaga **DEVE estar acessível** via URL direta

---

### TESTE 6: Admin Continua Vendo Todas as Vagas ✅

**Objetivo**: Verificar que o admin vê todas as vagas independente do flow_status

**Passos**:
1. Login como RH Admin
2. Navegar para **Gestão Completa de Vagas**
3. Verificar a lista

**Resultado Esperado**:
- ✅ Todas as vagas aparecem (ativas, concluídas, congeladas)
- ✅ Badges de flow_status aparecem corretamente
- ✅ É possível editar qualquer vaga

---

### TESTE 7: Edição Manual do Flow Status ✅

**Objetivo**: Verificar se é possível alterar flow_status manualmente

**Passos**:
1. Login como RH Admin
2. Navegar para **Gestão Completa de Vagas**
3. Clicar em **Editar** em uma vaga ativa
4. Alterar o **"Status de Visibilidade"** para "Congelada"
5. Salvar

**Resultado Esperado**:
- ✅ Vaga é salva com sucesso
- ✅ Badge de flow_status aparece na listagem
- ✅ Vaga some do site público

---

### TESTE 8: Vaga Nova Criada ✅

**Objetivo**: Verificar se vagas novas são criadas como 'ativa' por padrão

**Passos**:
1. Login como RH Admin
2. Criar uma nova vaga
3. Preencher todos os campos
4. **Publicar Direto** ou **Enviar para Aprovação → Aprovar → Criar**

**Resultado Esperado**:
- ✅ Vaga é criada com `flow_status = 'ativa'`
- ✅ Vaga aparece no site público imediatamente

---

### TESTE 9: Múltiplos Candidatos Aprovados ✅

**Objetivo**: Verificar comportamento quando múltiplos candidatos são aprovados

**Passos**:
1. Aprovar **Candidato 1** → Marcar vaga como **"Ativa"**
2. Aprovar **Candidato 2** → Marcar vaga como **"Concluída"**
3. Verificar site público

**Resultado Esperado**:
- ✅ Após primeira aprovação, vaga continua ativa
- ✅ Após segunda aprovação, vaga some do site
- ✅ Ambos candidatos ficam com status "Aprovado"

---

### TESTE 10: Compatibilidade com Vagas Antigas 🔄

**Objetivo**: Verificar se vagas antigas funcionam normalmente

**Passos**:
1. Verificar vagas criadas ANTES da migração
2. Tentar aprovar candidato de vaga antiga

**Resultado Esperado**:
- ✅ Vagas antigas aparecem no site (pois migration define como 'ativa')
- ✅ Modal funciona normalmente para vagas antigas
- ✅ Não há erros de compatibilidade

---

## 🐛 Possíveis Problemas e Soluções

### Problema 1: Modal não aparece
**Causa**: Hook não foi importado corretamente
**Solução**: Verificar imports no SelectionProcess.tsx

### Problema 2: Vaga não some do site
**Causa**: Migração não foi aplicada ou query não foi atualizada
**Solução**: 
```sql
-- Verificar se campo existe
SELECT flow_status FROM jobs LIMIT 1;

-- Atualizar manualmente se necessário
UPDATE jobs SET flow_status = 'concluida' WHERE id = 'UUID_DA_VAGA';
```

### Problema 3: Erro ao salvar flow_status
**Causa**: Enum não foi criado
**Solução**:
```sql
-- Criar enum manualmente
CREATE TYPE job_flow_status AS ENUM ('ativa', 'concluida', 'congelada');
```

---

## 📊 Queries Úteis para Debug

### Ver status de todas as vagas:
```sql
SELECT 
  id, 
  title, 
  status, 
  approval_status, 
  flow_status,
  city,
  state
FROM jobs
ORDER BY created_at DESC
LIMIT 20;
```

### Ver vagas que aparecem no site público:
```sql
SELECT 
  id, 
  title, 
  flow_status
FROM jobs
WHERE status = 'active' 
  AND approval_status = 'active' 
  AND flow_status = 'ativa'
ORDER BY created_at DESC;
```

### Contar vagas por flow_status:
```sql
SELECT 
  flow_status, 
  COUNT(*) as total
FROM jobs
GROUP BY flow_status;
```

---

## ✅ Checklist Final de Qualidade

Antes de considerar concluído:

- [ ] ✅ Todos os 10 testes passaram
- [ ] ✅ Sem erros de TypeScript
- [ ] ✅ Sem erros de lint
- [ ] ✅ Build executado com sucesso
- [ ] ✅ Migração aplicada no banco de produção
- [ ] ✅ Testado em diferentes navegadores
- [ ] ✅ Testado em mobile
- [ ] ✅ Documentação atualizada

---

## 🎯 Resumo da Implementação

**Arquivos Modificados**: 5
**Arquivos Criados**: 3
**Migração**: 1
**Tempo Estimado de Teste**: 15-20 minutos

**Impacto**: 
- ✅ Zero breaking changes
- ✅ 100% retrocompatível
- ✅ Melhora UX do RH
- ✅ Controle fino sobre visibilidade de vagas
