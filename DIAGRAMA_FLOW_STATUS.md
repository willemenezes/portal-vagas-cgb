# 📊 Diagrama do Sistema de Flow Status

## 🔄 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PROCESSO SELETIVO                            │
└─────────────────────────────────────────────────────────────────────┘

    [Candidato em Qualquer Fase]
              ↓
    ┌─────────────────────┐
    │  RH arrasta para    │
    │    "APROVADO"       │
    └─────────────────────┘
              ↓
    ┌─────────────────────────────────────────────┐
    │       🎯 MODAL APARECE AUTOMATICAMENTE       │
    │                                              │
    │  "Qual o status atual desta vaga?"          │
    │                                              │
    │  ┌────────────────────────────────────┐    │
    │  │  ○ ATIVA                           │    │
    │  │    → Vaga continua no site         │    │
    │  │    → Aceita novos candidatos       │    │
    │  └────────────────────────────────────┘    │
    │                                              │
    │  ┌────────────────────────────────────┐    │
    │  │  ○ CONCLUÍDA                       │    │
    │  │    → Vaga sai do site              │    │
    │  │    → Todas as posições preenchidas │    │
    │  └────────────────────────────────────┘    │
    │                                              │
    │  ┌────────────────────────────────────┐    │
    │  │  ○ CONGELADA                       │    │
    │  │    → Vaga sai do site              │    │
    │  │    → Temporariamente pausada       │    │
    │  └────────────────────────────────────┘    │
    │                                              │
    │         [Cancelar]  [Confirmar]             │
    └─────────────────────────────────────────────┘
              ↓
    ┌─────────────────────┐
    │  Sistema atualiza:  │
    │  1. Status candidato│
    │  2. Flow da vaga    │
    │  3. Cria nota       │
    └─────────────────────┘
              ↓
    ┌─────────────────────────────────────────────┐
    │           RESULTADO NO SISTEMA               │
    └─────────────────────────────────────────────┘

              ┌──────────────┬──────────────┬──────────────┐
              │              │              │              │
         [ATIVA]        [CONCLUÍDA]    [CONGELADA]
              │              │              │
    ✅ Aparece      ❌ Não aparece  ❌ Não aparece
    no site público   no site         no site
              │              │              │
    ✅ Aceita novos ✅ Processo    ✅ Processo
    candidatos      completo         pausado
```

---

## 🎨 Estados Visuais

### No Admin (Gestão de Vagas):

```
┌────────────────────────────────────────────────────────┐
│ Vaga              | Status                              │
├────────────────────────────────────────────────────────┤
│ Analista de RH    | [Ativa] 🟢                         │
│ 1 vaga disponível |                                     │
├────────────────────────────────────────────────────────┤
│ Agente Comercial  | [Ativa] 🟢                         │
│ 5/5 vagas         | [✓ Concluída] 🔵                   │
├────────────────────────────────────────────────────────┤
│ Desenvolvedor     | [Ativa] 🟢                         │
│ 2 vagas           | [⏸ Congelada] 🟠                   │
└────────────────────────────────────────────────────────┘
```

### No Site Público:

```
┌─────────────────────────────────────────┐
│         VAGAS DISPONÍVEIS                │
├─────────────────────────────────────────┤
│ ✅ Analista de RH                       │
│    (flow_status = 'ativa')              │
├─────────────────────────────────────────┤
│ ❌ Agente Comercial                     │
│    (flow_status = 'concluida')          │
│    → NÃO APARECE                        │
├─────────────────────────────────────────┤
│ ❌ Desenvolvedor                        │
│    (flow_status = 'congelada')          │
│    → NÃO APARECE                        │
└─────────────────────────────────────────┘
```

---

## 🔍 Queries de Validação

### 1. Verificar configuração correta:

```sql
-- Ver todas as vagas e seus status
SELECT 
  title,
  status,
  approval_status,
  flow_status,
  CASE 
    WHEN status = 'active' 
      AND approval_status = 'active' 
      AND flow_status = 'ativa' 
    THEN '✅ VISÍVEL NO SITE'
    ELSE '❌ NÃO VISÍVEL'
  END as visibilidade_publica
FROM jobs
ORDER BY created_at DESC;
```

### 2. Simular query do site público:

```sql
-- Esta é exatamente a query que o site público executa
SELECT * 
FROM jobs
WHERE status = 'active'
  AND approval_status = 'active'
  AND flow_status = 'ativa'
ORDER BY created_at DESC;
```

### 3. Ver histórico de mudanças:

```sql
-- Ver notas de candidatos aprovados
SELECT 
  c.name as candidato,
  j.title as vaga,
  cn.note,
  cn.created_at
FROM candidate_notes cn
JOIN candidates c ON c.id = cn.candidate_id
JOIN jobs j ON j.id = c.job_id
WHERE cn.activity_type = 'Aprovação'
ORDER BY cn.created_at DESC
LIMIT 10;
```

---

## 🎯 Cenários de Uso Real

### Cenário 1: Vaga com 1 posição
```
RH aprova candidato → Modal → Seleciona "Concluída"
→ Vaga some do site
→ Processo finalizado
```

### Cenário 2: Vaga com 5 posições
```
RH aprova candidato 1 → Modal → Seleciona "Ativa"
→ Vaga continua no site (4 vagas restantes)

RH aprova candidato 2 → Modal → Seleciona "Ativa"
→ Vaga continua no site (3 vagas restantes)

...

RH aprova candidato 5 → Modal → Seleciona "Concluída"
→ Vaga some do site (todas preenchidas)
```

### Cenário 3: Processo pausado temporariamente
```
RH precisa pausar processo → Edita vaga → "Congelada"
→ Vaga some do site
→ Candidatos atuais continuam no processo
→ Quando retomar: Edita vaga → "Ativa"
→ Vaga volta para o site
```

---

## ⚡ Testes de Performance

### Query de Performance:

```sql
-- Verificar se o índice está sendo usado
EXPLAIN ANALYZE
SELECT * 
FROM jobs
WHERE status = 'active'
  AND approval_status = 'active'
  AND flow_status = 'ativa';
```

**Resultado Esperado**:
- ✅ Deve usar `idx_jobs_flow_status`
- ✅ Tempo < 50ms para até 1000 vagas

---

## 🔒 Testes de Segurança

### 1. Usuário não autenticado:
```
Tentar acessar vaga concluída via URL direta:
→ /vaga/{uuid-da-vaga-concluida}

Resultado Esperado: "Vaga não encontrada"
```

### 2. RH sem permissão regional:
```
Tentar editar vaga de outra região:
→ Não deve aparecer na lista
→ Não deve permitir edição
```

---

## 📱 Testes de Responsividade

### Desktop (1920x1080):
- ✅ Modal centralizado
- ✅ Badges visíveis
- ✅ Formulário de edição completo

### Tablet (768x1024):
- ✅ Modal adapta largura
- ✅ Badges empilhados se necessário

### Mobile (375x667):
- ✅ Modal ocupa 90% da tela
- ✅ Botões empilhados verticalmente
- ✅ Badges responsivos

---

## 🚀 Checklist de Deploy

Antes de fazer `git add .`:

1. **Testes Funcionais**
   - [ ] TESTE 1: Modal aparece ✅
   - [ ] TESTE 2: Status atualiza ✅
   - [ ] TESTE 3: Vaga concluída não aparece ❌
   - [ ] TESTE 4: Vaga congelada não aparece ❌
   - [ ] TESTE 5: Vaga ativa aparece ✅
   - [ ] TESTE 6: Admin vê todas ✅
   - [ ] TESTE 7: Edição manual funciona ✅
   - [ ] TESTE 8: Vaga nova = ativa ✅
   - [ ] TESTE 9: Múltiplas aprovações ✅
   - [ ] TESTE 10: Compatibilidade ✅

2. **Testes Técnicos**
   - [ ] Sem erros de TypeScript
   - [ ] Sem erros de lint
   - [ ] Build executado (`npm run build`)
   - [ ] Preview testado (`npm run preview`)

3. **Testes de Banco**
   - [ ] Migração aplicada
   - [ ] Enum criado
   - [ ] Índice criado
   - [ ] Função atualizada

4. **Testes de UX**
   - [ ] Modal intuitivo
   - [ ] Mensagens claras
   - [ ] Badges bem posicionados
   - [ ] Sem travamentos

---

## 🎉 Resultado Final Esperado

Após todos os testes:

✅ **Site Público**: Mostra apenas vagas ativas
✅ **Admin**: Controle total sobre visibilidade
✅ **UX**: Modal intuitivo quando candidato é aprovado
✅ **Performance**: Queries otimizadas com índice
✅ **Compatibilidade**: Funciona com vagas antigas
✅ **Segurança**: RLS mantido em todas as operações
