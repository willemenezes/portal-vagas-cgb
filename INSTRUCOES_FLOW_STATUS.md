# 📋 Instruções para Implementar Flow Status

## O que foi implementado?

Um sistema de **cascata de status** para vagas quando um candidato é **APROVADO** no processo seletivo.

### Funcionalidades:

1. **Modal de Seleção de Status**: Quando o RH move um candidato para "Aprovado", aparece um modal perguntando qual o status da vaga:
   - ✅ **ATIVA** - Vaga continua visível no site público
   - ✅ **CONCLUÍDA** - Vaga foi preenchida, não aparece mais no site
   - ✅ **CONGELADA** - Vaga pausada temporariamente, não aparece no site

2. **Filtro Automático no Site Público**: Apenas vagas com `flow_status = 'ativa'` aparecem no site público.

3. **Controle Total no Admin**: O RH vê todas as vagas independente do flow_status.

---

## 📝 Arquivos Criados/Modificados

### Novos Arquivos:
1. ✅ `src/components/admin/JobStatusUpdateModal.tsx` - Modal de seleção de status
2. ✅ `supabase/migrations/20250130_add_job_flow_status.sql` - Migração do banco

### Arquivos Modificados:
1. ✅ `src/hooks/useJobs.tsx` - Adicionado campo `flow_status` e hook `useUpdateJobFlowStatus`
2. ✅ `src/components/admin/SelectionProcess.tsx` - Integração do modal quando candidato é aprovado

---

## 🚀 Como Aplicar as Mudanças (OFFLINE)

### Passo 1: Verificar Arquivos Modificados

Antes de fazer commit, vamos revisar o que foi alterado:

```bash
git status
git diff src/hooks/useJobs.tsx
git diff src/components/admin/SelectionProcess.tsx
```

### Passo 2: Aplicar Migração no Supabase

**IMPORTANTE**: Execute esta migração no Supabase **ANTES** de fazer deploy do código.

Opção A - Via Supabase CLI (Recomendado):
```bash
supabase db push
```

Opção B - Via Dashboard do Supabase:
1. Acesse https://app.supabase.com
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo de `supabase/migrations/20250130_add_job_flow_status.sql`
4. Execute a query

### Passo 3: Testar Localmente (Opcional)

Se tiver ambiente local do Supabase:

```bash
# Rodar migração local
supabase db reset

# Iniciar projeto
npm run dev
```

### Passo 4: Fazer Commit

Apenas quando tudo estiver ok:

```bash
git add .
git commit -m "feat: adicionar sistema de flow status para vagas

- Adiciona modal de seleção de status quando candidato é aprovado
- Implementa filtro automático no site público (apenas vagas ativas)
- Adiciona campo flow_status nas tabelas jobs e job_requests
- Status disponíveis: ativa, concluida, congelada"

git push origin main
```

---

## 🔍 Como Testar

### 1. Testar Modal de Aprovação:
1. Login como RH Admin
2. Ir em **Processos Seletivos**
3. Selecionar uma vaga com candidatos
4. Arrastar um candidato para a coluna **"Aprovado"**
5. ✅ **Deve aparecer** um modal perguntando o status da vaga
6. Selecionar um status (Ativa/Concluída/Congelada)
7. Confirmar

### 2. Testar Visibilidade no Site:
1. Marcar uma vaga como **"Concluída"** ou **"Congelada"**
2. Abrir o site público (sem login)
3. ✅ A vaga **NÃO deve aparecer** na lista
4. Marcar a vaga como **"Ativa"**
5. ✅ A vaga **deve aparecer** novamente

### 3. Testar Admin:
1. Login como RH
2. Ir em **Gestão Completa de Vagas**
3. ✅ Todas as vagas devem aparecer (independente do flow_status)

---

## 🛠️ Rollback (Se Necessário)

Se algo der errado, para reverter:

### 1. Reverter Código:
```bash
git revert HEAD
git push origin main
```

### 2. Reverter Migração do Banco:
```sql
-- Remover coluna flow_status
ALTER TABLE public.jobs DROP COLUMN IF EXISTS flow_status;
ALTER TABLE public.job_requests DROP COLUMN IF EXISTS flow_status;

-- Remover tipo ENUM
DROP TYPE IF EXISTS job_flow_status;

-- Restaurar função original (sem flow_status)
-- Ver arquivo de migração anterior para restaurar
```

---

## ⚠️ Pontos de Atenção

1. **Vagas Existentes**: Todas as vagas existentes serão marcadas como `'ativa'` automaticamente pela migração.

2. **Site Público**: Após a migração, o site público só mostrará vagas com `flow_status = 'ativa'`.

3. **Compatibilidade**: Esta mudança é **100% retrocompatível**. Não quebra nenhuma funcionalidade existente.

4. **Performance**: Foi criado um índice (`idx_jobs_flow_status`) para melhorar a performance das queries públicas.

---

## 📊 Estrutura do Banco de Dados

### Campo Adicionado:
```sql
flow_status job_flow_status DEFAULT 'ativa'
```

### Enum Criado:
```sql
CREATE TYPE job_flow_status AS ENUM ('ativa', 'concluida', 'congelada');
```

### Tabelas Afetadas:
- ✅ `public.jobs`
- ✅ `public.job_requests`

---

## ✅ Checklist Final

Antes de fazer git add:

- [ ] Testou o modal quando candidato é aprovado?
- [ ] Testou se vagas concluídas/congeladas somem do site?
- [ ] Testou se vagas ativas aparecem normalmente?
- [ ] Verificou se Admin continua vendo todas as vagas?
- [ ] Executou a migração no Supabase?
- [ ] Não há erros de lint? (`npm run lint`)
- [ ] Não há erros de build? (`npm run build`)

---

## 🎯 Resumo

Esta implementação adiciona um **controle de visibilidade inteligente** para vagas quando candidatos são aprovados, permitindo que o RH:

1. **Mantenha a vaga ativa** se ainda precisa de mais candidatos
2. **Marque como concluída** quando preencheu todas as vagas
3. **Congele temporariamente** se precisa pausar o processo

Tudo isso **sem afetar** nenhuma funcionalidade existente! 🚀
