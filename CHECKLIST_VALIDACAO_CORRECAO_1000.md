# ✅ Checklist de Validação - Correção Limite 1000 Registros

**Data:** 09/10/2025  
**Versão:** 1.0

---

## 🎯 Pré-Validação (Desenvolvimento Local)

### 1. Compilação e Build
- [ ] Executar `npm run build` sem erros
- [ ] Verificar que não há erros TypeScript críticos
- [ ] Verificar warnings relevantes no console

### 2. Testes Visuais Locais
- [ ] Dashboard carrega corretamente
- [ ] Processo Seletivo exibe candidatos
- [ ] Filtros funcionam
- [ ] Drag & drop funciona no kanban

---

## 📊 Validação do Dashboard

### Teste 1: Contagem Total de Candidatos
**Objetivo:** Verificar se o total de candidatos é exato

**Passos:**
1. [ ] Acessar o dashboard principal
2. [ ] Anotar o número total de candidatos exibido: _________
3. [ ] Executar SQL no Supabase:
   ```sql
   SELECT COUNT(*) as total FROM candidates;
   ```
4. [ ] Comparar os números:
   - Dashboard mostra: _________
   - SQL retorna: _________
   - ✅ Números batem?

**Resultado Esperado:** Números devem ser EXATAMENTE iguais

---

### Teste 2: Estatísticas por Status
**Objetivo:** Verificar se as contagens por status estão corretas

**Passos:**
1. [ ] No dashboard, anotar as estatísticas:
   - Pendentes: _________
   - Entrevista: _________
   - Aprovados: _________
   - Rejeitados: _________

2. [ ] Executar SQL no Supabase:
   ```sql
   SELECT 
     status,
     COUNT(*) as total
   FROM candidates
   WHERE created_at >= NOW() - INTERVAL '180 days'
   GROUP BY status
   ORDER BY status;
   ```

3. [ ] Comparar cada status individualmente
   - ✅ Todos batem?

**Resultado Esperado:** Contagens devem bater com SQL

---

### Teste 3: Gráfico de Cidades
**Objetivo:** Verificar top 5 cidades

**Passos:**
1. [ ] Anotar as 5 principais cidades no dashboard:
   1. _________ : _________
   2. _________ : _________
   3. _________ : _________
   4. _________ : _________
   5. _________ : _________

2. [ ] Executar SQL:
   ```sql
   SELECT 
     city,
     COUNT(*) as total
   FROM candidates
   WHERE created_at >= NOW() - INTERVAL '180 days'
     AND city IS NOT NULL
   GROUP BY city
   ORDER BY total DESC
   LIMIT 5;
   ```

3. [ ] Comparar resultados
   - ✅ Top 5 cidades batem?

**Resultado Esperado:** Mesma ordem e valores

---

## 🎯 Validação do Processo Seletivo

### Teste 4: Contagem de Candidatos por Vaga
**Objetivo:** Verificar se todos os candidatos de uma vaga aparecem

**Passos:**
1. [ ] Selecionar uma vaga no dropdown
   - Nome da vaga: _________________________
   - ID da vaga: _________________________

2. [ ] Somar manualmente o número em cada coluna:
   - Cadastrado: _________
   - Análise de Currículo: _________
   - Entrevista com RH: _________
   - Entrevista com Gestor: _________
   - Validação TJ: _________
   - Aprovado: _________
   - Reprovado: _________
   - **TOTAL MANUAL:** _________

3. [ ] Executar SQL no Supabase:
   ```sql
   SELECT 
     status,
     COUNT(*) as total
   FROM candidates
   WHERE job_id = 'ID_DA_VAGA'
   GROUP BY status
   ORDER BY status;
   
   -- Total geral
   SELECT COUNT(*) as total_geral
   FROM candidates
   WHERE job_id = 'ID_DA_VAGA';
   ```

4. [ ] Comparar:
   - Total manual (interface): _________
   - Total SQL: _________
   - ✅ Números batem?

**Resultado Esperado:** Total manual = Total SQL

---

### Teste 5: Vaga com Mais de 100 Candidatos
**Objetivo:** Testar com volume maior

**Passos:**
1. [ ] Identificar vaga com mais candidatos:
   ```sql
   SELECT 
     j.id,
     j.title,
     COUNT(c.id) as total_candidatos
   FROM jobs j
   LEFT JOIN candidates c ON c.job_id = j.id
   GROUP BY j.id, j.title
   ORDER BY total_candidatos DESC
   LIMIT 5;
   ```

2. [ ] Selecionar a vaga com mais candidatos
   - Nome: _________________________
   - Total esperado (SQL): _________

3. [ ] Verificar na interface:
   - Total exibido: _________
   - ✅ Bate com SQL?

4. [ ] Verificar performance:
   - Tempo de carregamento: _________ ms
   - ✅ Menor que 2 segundos?

**Resultado Esperado:** Todos os candidatos aparecem, performance boa

---

### Teste 6: Filtro de Abas (Ativos/Reprovados/Aprovados)
**Objetivo:** Verificar filtros por aba

**Passos:**
1. [ ] Selecionar uma vaga
2. [ ] Clicar na aba "Reprovados"
   - Contagem exibida: _________
3. [ ] Clicar na aba "Aprovados"
   - Contagem exibida: _________
4. [ ] Clicar na aba "Ativos"
   - Somar todas as colunas (exceto Reprovado/Aprovado): _________

5. [ ] Executar SQL:
   ```sql
   -- Reprovados
   SELECT COUNT(*) FROM candidates 
   WHERE job_id = 'ID_DA_VAGA' AND status = 'Reprovado';
   
   -- Aprovados
   SELECT COUNT(*) FROM candidates 
   WHERE job_id = 'ID_DA_VAGA' AND status = 'Aprovado';
   
   -- Ativos (todos exceto Reprovado/Aprovado/Contratado)
   SELECT COUNT(*) FROM candidates 
   WHERE job_id = 'ID_DA_VAGA' 
     AND status NOT IN ('Reprovado', 'Aprovado', 'Contratado');
   ```

6. [ ] Comparar cada aba:
   - ✅ Reprovados bate?
   - ✅ Aprovados bate?
   - ✅ Ativos bate?

**Resultado Esperado:** Todas as abas com contagens corretas

---

## 🔒 Validação de Permissões

### Teste 7: Perfil Administrador
**Objetivo:** Garantir que admin vê tudo

**Passos:**
1. [ ] Logar como administrador
2. [ ] Dashboard:
   - Total de candidatos: _________
   - Total de vagas: _________
3. [ ] Executar SQL (sem filtros):
   ```sql
   SELECT COUNT(*) FROM candidates;
   SELECT COUNT(*) FROM jobs WHERE status = 'active';
   ```
4. [ ] Comparar:
   - ✅ Admin vê TODOS os registros?

**Resultado Esperado:** Admin tem acesso completo

---

### Teste 8: Perfil Recrutador (com Filtro Regional)
**Objetivo:** Garantir que recrutador vê apenas sua região

**Passos:**
1. [ ] Identificar um recrutador com filtro regional:
   ```sql
   SELECT 
     full_name,
     email,
     role,
     assigned_states,
     assigned_cities
   FROM rh_users
   WHERE role = 'recruiter'
     AND (assigned_states IS NOT NULL OR assigned_cities IS NOT NULL)
   LIMIT 1;
   ```
   - Nome: _________________________
   - Estados: _________________________
   - Cidades: _________________________

2. [ ] Logar como esse recrutador

3. [ ] Dashboard:
   - Total de candidatos: _________
   - Total de vagas: _________

4. [ ] Executar SQL com filtro:
   ```sql
   -- Candidatos da região
   SELECT COUNT(*) FROM candidates c
   JOIN jobs j ON j.id = c.job_id
   WHERE j.state IN ('ESTADOS_DO_RECRUTADOR')
      OR j.city IN ('CIDADES_DO_RECRUTADOR');
   
   -- Vagas da região
   SELECT COUNT(*) FROM jobs
   WHERE status = 'active'
     AND (state IN ('ESTADOS') OR city IN ('CIDADES'));
   ```

5. [ ] Comparar:
   - ✅ Recrutador vê apenas sua região?

**Resultado Esperado:** Filtro regional funciona corretamente

---

## 🚀 Validação de Performance

### Teste 9: Tempo de Carregamento - Dashboard
**Objetivo:** Garantir que dashboard carrega rápido

**Passos:**
1. [ ] Abrir DevTools > Network
2. [ ] Limpar cache (Ctrl+Shift+Delete)
3. [ ] Acessar o dashboard
4. [ ] Anotar tempos:
   - Carregamento inicial: _________ ms
   - Query de candidatos: _________ ms
   - Query de vagas: _________ ms
   - **Total:** _________ ms

5. [ ] Verificar:
   - ✅ Carregamento < 3 segundos?
   - ✅ Sem queries duplicadas?

**Resultado Esperado:** Performance aceitável (< 3s)

---

### Teste 10: Tempo de Carregamento - Processo Seletivo
**Objetivo:** Verificar performance ao selecionar vagas

**Passos:**
1. [ ] Abrir DevTools > Network
2. [ ] Acessar Processo Seletivo
3. [ ] Selecionar 3 vagas diferentes e anotar tempos:

   **Vaga 1:** _________________________
   - Tempo de carregamento: _________ ms
   - Número de candidatos: _________

   **Vaga 2:** _________________________
   - Tempo de carregamento: _________ ms
   - Número de candidatos: _________

   **Vaga 3:** _________________________
   - Tempo de carregamento: _________ ms
   - Número de candidatos: _________

4. [ ] Verificar:
   - ✅ Cada vaga carrega < 2 segundos?
   - ✅ Apenas candidatos da vaga são buscados?
   - ✅ Não há busca global de todos os candidatos?

**Resultado Esperado:** Busca otimizada, apenas vaga selecionada

---

## 🐛 Validação de Funcionalidades Existentes

### Teste 11: Drag & Drop no Kanban
**Objetivo:** Garantir que arrastar candidatos ainda funciona

**Passos:**
1. [ ] Selecionar uma vaga
2. [ ] Arrastar um candidato de "Cadastrado" para "Análise de Currículo"
3. [ ] Verificar:
   - ✅ Candidato mudou de coluna?
   - ✅ Contagem atualizada?
   - ✅ Toast de sucesso apareceu?

4. [ ] Arrastar para "Validação TJ"
   - ✅ Funciona?

5. [ ] Arrastar para "Aprovado"
   - ✅ Modal de status da vaga aparece?

**Resultado Esperado:** Drag & drop funciona perfeitamente

---

### Teste 12: Modal de Detalhes do Candidato
**Objetivo:** Verificar que clicar no candidato abre detalhes

**Passos:**
1. [ ] Clicar em um candidato no kanban
2. [ ] Verificar:
   - ✅ Modal abre?
   - ✅ Dados corretos exibidos?
   - ✅ Histórico carrega?
   - ✅ Botões funcionam?

**Resultado Esperado:** Modal funciona normalmente

---

### Teste 13: Rejeição de Candidato
**Objetivo:** Testar fluxo de reprovação

**Passos:**
1. [ ] Arrastar candidato para "Reprovado"
2. [ ] Verificar:
   - ✅ Modal de motivo aparece?
3. [ ] Preencher motivo e confirmar
4. [ ] Verificar:
   - ✅ Candidato vai para coluna "Reprovado"?
   - ✅ Nota salva no histórico?

**Resultado Esperado:** Fluxo de rejeição completo funciona

---

## 📱 Validação de Responsividade

### Teste 14: Dashboard em Mobile
**Passos:**
1. [ ] Abrir DevTools > Device Toolbar (Ctrl+Shift+M)
2. [ ] Selecionar "iPhone 12 Pro"
3. [ ] Verificar:
   - ✅ Layout responsivo?
   - ✅ Gráficos legíveis?
   - ✅ Números visíveis?

**Resultado Esperado:** Dashboard funciona em mobile

---

### Teste 15: Processo Seletivo em Tablet
**Passos:**
1. [ ] Selecionar "iPad Pro"
2. [ ] Verificar:
   - ✅ Kanban ajusta bem?
   - ✅ Drag & drop funciona?
   - ✅ Colunas visíveis?

**Resultado Esperado:** Processo Seletivo funciona em tablet

---

## 🔍 Validação de Logs e Erros

### Teste 16: Console do Navegador
**Passos:**
1. [ ] Abrir DevTools > Console
2. [ ] Navegar pelo sistema completo
3. [ ] Verificar:
   - ✅ Sem erros vermelhos?
   - ✅ Warnings são apenas informativos?
   - ✅ Aviso de limite de 2000 aparece quando aplicável?

**Resultado Esperado:** Console limpo ou apenas warnings esperados

---

### Teste 17: Network Requests
**Passos:**
1. [ ] DevTools > Network
2. [ ] Filtrar por "Fetch/XHR"
3. [ ] Navegar pelo sistema
4. [ ] Verificar:
   - ✅ Sem requests com status 4xx ou 5xx?
   - ✅ Requests com query params corretos?
   - ✅ Uso de `count=exact` onde esperado?

**Resultado Esperado:** Todas as requests bem-sucedidas

---

## 📊 Comparação Antes/Depois

### Métricas de Sucesso

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Total de candidatos (Dashboard) | 1000 (fixo) | _____ (real) | ✅ |
| Tempo de load - Dashboard | ~500ms | _____ ms | _____ % |
| Tempo de load - Processo Seletivo | ~500ms | _____ ms | _____ % |
| Precisão das contagens | ❌ Incorreto | ✅ Correto | 100% |
| Vagas com 100+ candidatos | ❌ Não carrega todos | _____ (testar) | ✅ |

---

## ✅ Aprovação Final

### Critérios de Aceitação
- [ ] ✅ Dashboard mostra contagens exatas (> 1000 candidatos)
- [ ] ✅ Processo Seletivo mostra todos os candidatos de cada vaga
- [ ] ✅ Soma das colunas = total de candidatos da vaga
- [ ] ✅ Performance aceitável (< 3s para dashboard, < 2s para vagas)
- [ ] ✅ Filtros de recrutador funcionam
- [ ] ✅ Drag & drop funciona
- [ ] ✅ Sem erros no console
- [ ] ✅ Responsivo em mobile/tablet

### Aprovação
- [ ] **Todos os testes passaram?**
- [ ] **Sistema pronto para deploy?**
- [ ] **Documentação completa?**

---

## 📝 Observações e Problemas Encontrados

**Durante os testes, anote aqui qualquer problema ou comportamento inesperado:**

```
Data: ___/___/____
Teste: #___
Problema: 
_____________________________________________________________
_____________________________________________________________

Resolução:
_____________________________________________________________
_____________________________________________________________
```

---

## 🚀 Pré-Deploy (Quando Solicitado)

- [ ] Todos os testes locais passaram
- [ ] Código revisado
- [ ] Sem erros TypeScript críticos
- [ ] Performance validada
- [ ] Backup do banco de dados feito
- [ ] Usuário solicitou explicitamente o deploy

---

**Validado por:** _________________________  
**Data:** ___/___/____  
**Hora:** ___:___  
**Status:** [ ] ✅ Aprovado  [ ] ❌ Reprovado  [ ] ⏸️ Pendente

