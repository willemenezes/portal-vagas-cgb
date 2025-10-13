# 📋 Análise e Proposta: Controle de Gerentes por Departamento

## 🔍 Análise do Cenário Atual

### Sistema de Aprovação Existente

**Como funciona hoje:**
1. **Criação de Vaga**: RH cria solicitação de vaga com departamento
2. **Aprovação**: Gerentes aprovam baseado apenas em **Estado + Cidade**
3. **Problema**: Todos os gerentes da mesma região veem todas as vagas

**Estrutura Atual da Tabela `rh_users`:**
```sql
CREATE TABLE rh_users (
    user_id UUID REFERENCES auth.users(id),
    email TEXT,
    full_name TEXT,
    role TEXT, -- 'admin', 'recruiter', 'manager', 'juridico', 'solicitador'
    is_admin BOOLEAN,
    assigned_states TEXT[], -- Array de estados: ['PA', 'AP']
    assigned_cities TEXT[], -- Array de cidades: ['Belém', 'Santarém']
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Filtro Atual de Gerentes (arquivo: `src/utils/notifications.ts`):**
```typescript
// Busca gerentes por região (estado/cidade)
export const getManagersByRegion = async (state: string, city: string) => {
  const { data } = await supabase
    .from('rh_users')
    .select('email, full_name, role, assigned_states, assigned_cities')
    .in('role', ['manager', 'gerente']);

  return data?.filter(user => {
    // Verifica se tem o estado
    if (user.assigned_states?.includes(state)) {
      // Se tem cidades específicas, verifica se inclui a cidade
      if (user.assigned_cities?.length > 0) {
        return user.assigned_cities.includes(city);
      }
      return true; // Tem estado mas sem cidades = vê todas do estado
    }
    return false;
  });
};
```

---

## 🎯 Nova Proposta: Controle por Departamento

### Objetivo
Fazer com que gerentes vejam apenas vagas do seu **Departamento + Estado + Cidade**.

### Exemplo Prático
```
Estado: PA, Cidade: Belém
├── Gerente de Atendimento → vê apenas vagas de "Atendimento"
├── Gerente de Operação → vê apenas vagas de "Técnico em Eletrotécnica", "Operador", etc.
└── Gerente Financeiro → vê apenas vagas de "Financeiro", "Analista Administrativo"
```

---

## 🏗️ Implementação Recomendada

### Opção 1: Campo Direto (RECOMENDADA)
**Vantagem**: Simples, compatível, sem quebra de funcionalidade.

#### 1.1. Migração do Banco
```sql
-- Adicionar campo assigned_departments à tabela rh_users
ALTER TABLE public.rh_users 
ADD COLUMN assigned_departments TEXT[] DEFAULT NULL;

-- Comentário para documentação
COMMENT ON COLUMN public.rh_users.assigned_departments IS 
'Array de departamentos que o gerente pode aprovar vagas. NULL = todos os departamentos';

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_rh_users_assigned_departments 
ON public.rh_users USING GIN (assigned_departments);
```

#### 1.2. Atualização do Cadastro de Gerente
**Arquivo**: `src/components/admin/RHManagement.tsx`

```typescript
// Adicionar campo no formulário
const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

// No JSX do formulário
{role === 'manager' && (
  <div className="space-y-2">
    <Label>Departamentos Autorizados *</Label>
    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
      {departments.map(dept => (
        <div key={dept} className="flex items-center space-x-2">
          <Checkbox
            id={`dept-${dept}`}
            checked={selectedDepartments.includes(dept)}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedDepartments([...selectedDepartments, dept]);
              } else {
                setSelectedDepartments(selectedDepartments.filter(d => d !== dept));
              }
            }}
          />
          <Label htmlFor={`dept-${dept}`} className="text-sm">{dept}</Label>
        </div>
      ))}
    </div>
    <p className="text-xs text-gray-500">
      Selecione os departamentos que este gerente pode aprovar vagas
    </p>
  </div>
)}
```

#### 1.3. Atualização do Filtro de Aprovação
**Arquivo**: `src/utils/notifications.ts`

```typescript
export const getManagersByRegion = async (
  state: string, 
  city: string, 
  department: string
): Promise<NotificationRecipient[]> => {
  const { data } = await supabase
    .from('rh_users')
    .select('email, full_name, role, assigned_states, assigned_cities, assigned_departments')
    .in('role', ['manager', 'gerente']);

  return data?.filter(user => {
    // 1. Verificar região (estado/cidade) - MANTÉM LÓGICA ATUAL
    const hasRegion = checkRegionAccess(user, state, city);
    if (!hasRegion) return false;

    // 2. NOVO: Verificar departamento
    if (user.assigned_departments && user.assigned_departments.length > 0) {
      return user.assigned_departments.includes(department);
    }
    
    // Se não tem departamentos específicos = vê todos (compatibilidade)
    return true;
  }) || [];
};

const checkRegionAccess = (user: any, state: string, city: string) => {
  if (user.assigned_states?.includes(state)) {
    if (user.assigned_cities?.length > 0) {
      return user.assigned_cities.includes(city);
    }
    return true;
  }
  return false;
};
```

#### 1.4. Atualização das Queries de Aprovação
**Arquivo**: `src/hooks/useJobs.tsx`

```typescript
export const usePendingJobs = (rhProfile: RHUser | null | undefined) => {
  return useQuery<Job[], Error>({
    queryKey: ['pendingJobs', rhProfile?.user_id],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('approval_status', 'pending_approval')
        .order('created_at', { ascending: false });

      // NOVO: Filtro por departamento para gerentes
      if (rhProfile?.role === 'manager' && rhProfile.assigned_departments?.length > 0) {
        query = query.in('department', rhProfile.assigned_departments);
      }

      // Filtro por região (mantém lógica atual)
      if (rhProfile?.assigned_states?.length > 0) {
        query = query.in('state', rhProfile.assigned_states);
      }
      
      if (rhProfile?.assigned_cities?.length > 0) {
        query = query.in('city', rhProfile.assigned_cities);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!rhProfile,
  });
};
```

---

## 🔄 Migração de Dados Existentes

### Script de Migração Segura
```sql
-- 1. Backup dos dados atuais
CREATE TABLE rh_users_backup AS SELECT * FROM rh_users;

-- 2. Para gerentes existentes sem departamento definido, 
--    deixar NULL (verão todos os departamentos)
UPDATE rh_users 
SET assigned_departments = NULL 
WHERE role IN ('manager', 'gerente') 
  AND assigned_departments IS NULL;

-- 3. Verificar resultado
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
FROM rh_users 
WHERE role IN ('manager', 'gerente')
ORDER BY full_name;
```

---

## 📊 Impacto e Compatibilidade

### ✅ Vantagens
1. **Zero Breaking Changes**: Gerentes existentes continuam funcionando
2. **Controle Granular**: Cada gerente vê apenas seu escopo
3. **Flexibilidade**: Pode atribuir múltiplos departamentos
4. **Performance**: Índices GIN para arrays otimizam consultas
5. **Auditoria**: Histórico de quem aprovou o quê fica mais claro

### ⚠️ Considerações
1. **Gerentes Existentes**: Inicialmente verão todos os departamentos (NULL)
2. **Configuração Manual**: Admin precisa configurar departamentos para cada gerente
3. **Validação**: Implementar validação para não deixar gerente sem departamento

### 🔒 Segurança
- Mantém RLS (Row Level Security) existente
- Adiciona camada extra de filtro por departamento
- Não afeta outras roles (admin, recruiter, juridico)

---

## 🚀 Plano de Implementação

### Fase 1: Preparação (1-2 dias)
1. ✅ Criar migração do banco (`assigned_departments`)
2. ✅ Atualizar interface de cadastro de gerente
3. ✅ Implementar validação no frontend

### Fase 2: Lógica de Filtro (1-2 dias)
1. ✅ Atualizar `getManagersByRegion()` 
2. ✅ Modificar `usePendingJobs()` hook
3. ✅ Testar filtros em desenvolvimento

### Fase 3: Migração e Deploy (1 dia)
1. ✅ Aplicar migração em produção
2. ✅ Configurar departamentos para gerentes existentes
3. ✅ Validar funcionamento em produção

### Fase 4: Monitoramento (1 semana)
1. ✅ Acompanhar logs de aprovação
2. ✅ Validar se gerentes veem apenas seu escopo
3. ✅ Ajustar configurações se necessário

---

## 💡 Melhorias Futuras

### Interface de Gestão de Departamentos
- Tela para admin gerenciar lista de departamentos
- Mover departamentos para tabela própria no banco
- Hierarquia de departamentos (pai/filho)

### Relatórios e Auditoria
- Relatório de aprovações por gerente/departamento
- Dashboard de performance por área
- Alertas de vagas sem gerente responsável

### Automação
- Auto-atribuição de gerente baseado em regras
- Notificações inteligentes por departamento
- Escalação automática se gerente não aprovar em X dias

---

## 🎯 Conclusão

A implementação proposta é **segura, compatível e escalável**. Resolve o problema atual sem quebrar funcionalidades existentes, mantendo a flexibilidade para futuras melhorias.

**Próximo passo**: Implementar a Fase 1 (migração do banco + interface) para validação em ambiente de desenvolvimento.
