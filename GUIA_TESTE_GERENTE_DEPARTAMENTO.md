# 🧪 Guia de Testes: Controle de Gerentes por Departamento

## ✅ Implementação Concluída

### Arquivos Modificados:
1. ✅ `supabase/migrations/20251013_add_assigned_departments.sql` - Migração aplicada
2. ✅ `src/components/admin/RHManagement.tsx` - Interface atualizada
3. ✅ `src/hooks/useRH.tsx` - Types atualizados
4. ✅ `src/hooks/useJobs.tsx` - Filtro por departamento em `usePendingJobs`
5. ✅ `src/utils/notifications.ts` - `getManagersByRegion` com suporte a departamento
6. ✅ `src/hooks/useJobRequests.tsx` - Notificações com departamento
7. ✅ `supabase/functions/create-user-direct/index.ts` - Edge function atualizada

---

## 🧪 Plano de Testes

### Teste 1: Criar Gerente com Departamentos
**Objetivo**: Verificar se a interface de cadastro funciona corretamente

**Passos**:
1. Login como Admin
2. Ir em "Gestão de RH"
3. Clicar em "Adicionar Novo Membro"
4. Preencher:
   - Nome: Gerente Teste Atendimento
   - Email: gerente.atendimento@cgb.test
   - Role: Gerência
   - Estado: PA
   - Cidade: Belém
   - **Departamentos**: Selecionar "Atendimento", "Assistente Administrativo"
5. Salvar

**Resultado Esperado**:
- ✅ Gerente criado com sucesso
- ✅ Aparece na lista com departamentos exibidos
- ✅ Banco mostra `assigned_departments = ['Atendimento', 'Assistente Administrativo']`

---

### Teste 2: Editar Gerente Existente
**Objetivo**: Verificar se pode adicionar departamentos a gerentes antigos

**Passos**:
1. Selecionar um gerente existente (sem departamentos)
2. Clicar em Editar
3. Adicionar departamentos
4. Salvar

**Resultado Esperado**:
- ✅ Departamentos adicionados com sucesso
- ✅ Interface atualiza mostrando os departamentos

---

### Teste 3: Filtro de Aprovação por Departamento
**Objetivo**: Verificar se gerente vê apenas vagas do seu departamento

**Cenário A - Gerente COM departamentos específicos**:
1. Criar vaga de "Atendimento" (Belém, PA) - status "pendente de aprovação"
2. Criar vaga de "Financeiro" (Belém, PA) - status "pendente de aprovação"
3. Login como gerente que tem apenas "Atendimento"
4. Ir em "Aprovações de Vagas"

**Resultado Esperado**:
- ✅ Vê apenas vaga de "Atendimento"
- ✅ NÃO vê vaga de "Financeiro"
- ✅ Console mostra: `Filtrando por departamentos: ['Atendimento']`

**Cenário B - Gerente SEM departamentos (NULL = compatibilidade)**:
1. Login como gerente sem departamentos configurados
2. Ir em "Aprovações de Vagas"

**Resultado Esperado**:
- ✅ Vê TODAS as vagas da região dele
- ✅ Console mostra: `assigned_departments: null` → vê todos

---

### Teste 4: Notificações
**Objetivo**: Verificar se notificações são enviadas apenas para gerentes corretos

**Passos**:
1. Criar solicitação de vaga:
   - Departamento: "FROTA"
   - Estado: PA
   - Cidade: Belém
2. Verificar console do navegador

**Resultado Esperado**:
- ✅ Console mostra: `Buscando gerentes para região: PA, Belém, departamento: FROTA`
- ✅ Apenas gerentes com "FROTA" ou sem departamentos recebem notificação
- ✅ Gerentes de outros departamentos NÃO recebem

---

### Teste 5: Compatibilidade (Gerentes Antigos)
**Objetivo**: Garantir que gerentes existentes continuam funcionando

**Passos**:
1. Verificar gerentes existentes no banco:
```sql
SELECT 
  full_name,
  role,
  assigned_states,
  assigned_cities,
  assigned_departments,
  CASE 
    WHEN assigned_departments IS NULL THEN 'Vê todos os departamentos'
    ELSE array_to_string(assigned_departments, ', ')
  END as departamentos_permitidos
FROM public.rh_users 
WHERE role IN ('manager', 'gerente')
ORDER BY full_name;
```

**Resultado Esperado**:
- ✅ Gerentes existentes têm `assigned_departments = NULL`
- ✅ Continuam vendo todas as vagas da região deles
- ✅ Sem erros no sistema

---

### Teste 6: Múltiplos Departamentos
**Objetivo**: Verificar se gerente pode ter vários departamentos

**Passos**:
1. Criar gerente com departamentos: ["Atendimento", "COBRANÇA", "LEITURA"]
2. Criar 3 vagas:
   - Vaga A: Atendimento (Belém)
   - Vaga B: COBRANÇA (Belém)
   - Vaga C: Financeiro (Belém)
3. Login como esse gerente

**Resultado Esperado**:
- ✅ Vê vagas A e B
- ✅ NÃO vê vaga C

---

## 🔍 Queries de Validação

### 1. Verificar estrutura da tabela
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'rh_users' 
  AND column_name IN ('assigned_states', 'assigned_cities', 'assigned_departments')
ORDER BY ordinal_position;
```

### 2. Listar todos os gerentes e suas permissões
```sql
SELECT 
  full_name,
  email,
  role,
  assigned_states,
  assigned_cities,
  assigned_departments,
  CASE 
    WHEN assigned_departments IS NULL THEN '✅ Vê todos os departamentos'
    WHEN array_length(assigned_departments, 1) IS NULL THEN '⚠️ Array vazio'
    ELSE '🔒 Limitado a: ' || array_to_string(assigned_departments, ', ')
  END as status_departamentos
FROM public.rh_users 
WHERE role IN ('manager', 'gerente')
ORDER BY full_name;
```

### 3. Testar função auxiliar
```sql
-- Pegar um user_id de gerente
SELECT user_id, full_name, assigned_departments 
FROM public.rh_users 
WHERE role = 'manager' 
LIMIT 1;

-- Testar a função (substituir UUID abaixo pelo user_id real)
SELECT 
  public.manager_has_department_access(
    'SEU-UUID-AQUI'::UUID, 
    'Atendimento'
  ) as tem_acesso_atendimento,
  public.manager_has_department_access(
    'SEU-UUID-AQUI'::UUID, 
    'Financeiro'
  ) as tem_acesso_financeiro;
```

### 4. Simular filtro de vagas para gerente
```sql
-- Exemplo: Gerente com departamentos ['Atendimento', 'COBRANÇA']
-- e estado PA, cidade Belém
SELECT 
  id,
  title,
  department,
  city,
  state,
  approval_status
FROM public.jobs
WHERE approval_status = 'pending_approval'
  AND department IN ('Atendimento', 'COBRANÇA')  -- Filtro por departamento
  AND state = 'PA'                                -- Filtro por estado
  AND city = 'Belém'                              -- Filtro por cidade
ORDER BY created_at DESC;
```

---

## ⚠️ Problemas Comuns e Soluções

### Problema 1: Gerente não vê nenhuma vaga
**Causa**: `assigned_departments` pode estar como array vazio `[]` ao invés de `NULL`

**Solução**:
```sql
UPDATE public.rh_users 
SET assigned_departments = NULL 
WHERE role IN ('manager', 'gerente') 
  AND (assigned_departments IS NULL OR array_length(assigned_departments, 1) IS NULL);
```

### Problema 2: Gerente vê todas as vagas mesmo tendo departamentos específicos
**Causa**: Interface pode não estar salvando os departamentos

**Solução**:
1. Verificar no console do navegador se está enviando `assignedDepartments`
2. Verificar no banco se o campo foi atualizado
3. Limpar cache do navegador (Ctrl+Shift+R)

### Problema 3: Erro ao criar gerente
**Causa**: Edge Function pode não estar atualizada

**Solução**:
```bash
# Fazer deploy da Edge Function atualizada
supabase functions deploy create-user-direct
```

---

## 📊 Checklist Final

Antes de considerar concluído, verificar:

- [ ] ✅ Migração SQL executada sem erros
- [ ] ✅ Interface mostra campo "Departamentos Autorizados" para gerentes
- [ ] ✅ Consegue criar gerente com departamentos
- [ ] ✅ Consegue editar gerente e adicionar/remover departamentos
- [ ] ✅ Lista de usuários mostra departamentos de cada gerente
- [ ] ✅ Gerente com departamentos vê apenas vagas do seu escopo
- [ ] ✅ Gerente sem departamentos (NULL) vê todas as vagas da região
- [ ] ✅ Notificações são enviadas apenas para gerentes corretos
- [ ] ✅ Console mostra logs de filtro por departamento
- [ ] ✅ Sem erros no console do navegador
- [ ] ✅ Sem erros no linter

---

## 🎯 Próximos Passos Após Testes

Se todos os testes passarem:
1. ✅ Documentar qualquer comportamento inesperado
2. ✅ Configurar departamentos para gerentes existentes
3. ✅ Treinar equipe sobre nova funcionalidade
4. ✅ Monitorar logs por 1 semana
5. ✅ Coletar feedback dos gerentes
