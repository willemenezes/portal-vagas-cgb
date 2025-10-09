# ⚡ Guia de Teste Local Rápido

**Tempo estimado:** 5-10 minutos  
**Objetivo:** Validar que as correções funcionam antes de fazer deploy

---

## 🚀 Passo 1: Iniciar o Projeto Localmente

```bash
# Se ainda não estiver rodando, inicie o servidor de desenvolvimento
npm run dev
```

**Aguarde até ver:**
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🧪 Passo 2: Teste do Dashboard (2 minutos)

### 2.1 Acesse o Dashboard
1. Abra o navegador em `http://localhost:5173`
2. Faça login (use suas credenciais de administrador)
3. Vá para o Dashboard principal

### 2.2 Verificações Visuais

**✅ Checklist:**
- [ ] O dashboard carrega sem erros
- [ ] Total de candidatos está sendo exibido
- [ ] Número parece razoável (não está fixo em 1000)
- [ ] Gráficos aparecem corretamente
- [ ] Não há mensagens de erro

### 2.3 Abra o Console do Navegador
```
Pressione F12 > Aba Console
```

**✅ O que procurar:**
- [ ] Sem erros vermelhos (podem ter warnings amarelos, ok)
- [ ] Se houver aviso sobre limite de 2000, anote (indica que correção está ativa)

### 2.4 Compare com o Banco de Dados
```
1. Abra o Supabase (https://supabase.com)
2. Vá para SQL Editor
3. Execute:
   SELECT COUNT(*) FROM candidates;
4. Compare o número com o dashboard
```

**✅ Resultado esperado:**
- Dashboard mostra: __________ candidatos
- Banco de dados tem: __________ candidatos
- [ ] Números são IGUAIS ou muito próximos

---

## 🎯 Passo 3: Teste do Processo Seletivo (3 minutos)

### 3.1 Acesse o Processo Seletivo
1. No menu, clique em "Processo Seletivo"
2. Aguarde carregar a lista de vagas

### 3.2 Selecione uma Vaga
```
Escolha qualquer vaga do dropdown
```

**✅ Checklist:**
- [ ] A vaga carrega rapidamente (< 2 segundos)
- [ ] Candidatos aparecem nas colunas do Kanban
- [ ] Números nas colunas parecem corretos

### 3.3 Some Manualmente as Colunas
```
Exemplo:
Cadastrado: 15
Análise de Currículo: 8
Entrevista com RH: 5
Entrevista com Gestor: 3
Validação TJ: 2
Aprovado: 1
Reprovado: 10
─────────────────────
TOTAL: 44 candidatos
```

**Anote aqui:**
- Total que você somou: __________

### 3.4 Compare com o Banco
```sql
-- Execute no Supabase SQL Editor
-- Substitua 'ID_DA_VAGA' pelo ID real

SELECT COUNT(*) as total
FROM candidates
WHERE job_id = 'ID_DA_VAGA';
```

**✅ Resultado esperado:**
- Sua soma manual: __________
- SQL retornou: __________
- [ ] Números BATEM (ou diferença < 5%)

---

## 🔍 Passo 4: Teste de Performance (2 minutos)

### 4.1 Abra o DevTools
```
F12 > Aba Network
```

### 4.2 Teste o Dashboard
1. Clique em "Dashboard" no menu
2. Aguarde carregar completamente
3. No Network, procure por requests para `candidates`

**✅ O que verificar:**
- [ ] Request tem parâmetro `count=exact`
- [ ] Resposta é rápida (< 1 segundo)
- [ ] Não há múltiplas requests duplicadas

### 4.3 Teste o Processo Seletivo
1. Clique em "Processo Seletivo"
2. Selecione uma vaga
3. No Network, procure por requests para `candidates`

**✅ O que verificar:**
- [ ] Request tem filtro `job_id=eq.XXXX`
- [ ] Não busca TODOS os candidatos
- [ ] Resposta é rápida (< 1 segundo)

---

## 🎨 Passo 5: Teste de Funcionalidades (2 minutos)

### 5.1 Drag & Drop
```
No Processo Seletivo:
1. Selecione uma vaga com candidatos
2. Arraste um candidato de uma coluna para outra
```

**✅ Checklist:**
- [ ] Candidato se move suavemente
- [ ] Aparece toast de confirmação
- [ ] Número na coluna atualiza
- [ ] Sem erros no console

### 5.2 Abrir Detalhes do Candidato
```
1. Clique em qualquer card de candidato
```

**✅ Checklist:**
- [ ] Modal abre
- [ ] Informações aparecem
- [ ] Histórico carrega
- [ ] Botões funcionam

### 5.3 Filtro por Abas
```
1. Clique na aba "Reprovados"
2. Clique na aba "Aprovados"
3. Volte para "Ativos"
```

**✅ Checklist:**
- [ ] Cada aba mostra candidatos corretos
- [ ] Contagens parecem razoáveis
- [ ] Transições são suaves

---

## 📊 Passo 6: Validação SQL Completa (Opcional)

Se quiser validação 100% precisa:

```bash
1. Abra: VALIDACAO_SQL_CORRECAO.sql
2. Copie as queries mais importantes
3. Execute no Supabase SQL Editor
4. Compare cada resultado com a interface
```

**Queries essenciais:**
- Total de candidatos (query 1.1)
- Candidatos por vaga (query 2.1)
- Verificar limite de 1000 (query 5.1)

---

## ✅ Resultado Final

### Aprovação Mínima (pode fazer deploy):
- [ ] Dashboard mostra total correto de candidatos
- [ ] Processo Seletivo mostra todos os candidatos de cada vaga
- [ ] Soma das colunas = total de candidatos
- [ ] Sem erros no console
- [ ] Performance aceitável (< 3 segundos)

### Aprovação Completa (ideal):
- [ ] Todos os itens acima ✅
- [ ] Validação SQL confirma números
- [ ] Drag & drop funciona
- [ ] Modais funcionam
- [ ] Filtros funcionam

---

## 🚨 Se Encontrar Problemas

### Dashboard não atualiza o total:
```bash
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Recarregue a página (Ctrl+F5)
3. Verifique se há erros no console
```

### Processo Seletivo não mostra todos os candidatos:
```bash
1. Abra o DevTools > Network
2. Procure por requests para 'candidates'
3. Verifique se tem filtro job_id correto
4. Veja a resposta da API
```

### Performance lenta:
```bash
1. Verifique sua conexão com internet
2. Verifique se o Supabase está online
3. Tente com outra vaga (pode ser volume de dados)
```

### Erros no console:
```bash
1. Copie a mensagem de erro completa
2. Verifique o arquivo/linha indicado
3. Confira se não é erro preexistente
```

---

## 📝 Anotações de Teste

**Data/Hora do teste:** ___/___/___ às ___:___

### Dashboard:
- Total de candidatos (interface): __________
- Total de candidatos (SQL): __________
- Status: [ ] ✅ OK  [ ] ❌ Problema

### Processo Seletivo:
- Vaga testada: _______________________________
- Soma manual: __________
- Total SQL: __________
- Status: [ ] ✅ OK  [ ] ❌ Problema

### Performance:
- Dashboard carregou em: __________ ms
- Processo Seletivo carregou em: __________ ms
- Status: [ ] ✅ Rápido  [ ] ⚠️ Lento

### Funcionalidades:
- Drag & Drop: [ ] ✅ OK  [ ] ❌ Quebrado
- Modais: [ ] ✅ OK  [ ] ❌ Quebrado
- Filtros: [ ] ✅ OK  [ ] ❌ Quebrado

---

## 🎉 Conclusão do Teste

### Resultado:
- [ ] ✅ **APROVADO** - Tudo funcionando, pode solicitar deploy
- [ ] ⚠️ **APROVADO COM RESSALVAS** - Funciona mas tem pequenos problemas
- [ ] ❌ **REPROVADO** - Problemas críticos encontrados

### Observações:
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## 🚀 Próximo Passo

### Se APROVADO:
```
Você pode me solicitar para fazer o git push com:
"Pode fazer o git push para colocar online"
```

### Se REPROVADO:
```
Me informe os problemas encontrados que vou corrigir:
"Encontrei problema X ao fazer Y"
```

---

**⏱️ Tempo total estimado:** 5-10 minutos  
**✅ Validação básica:** Dashboard + Processo Seletivo (3 min)  
**✅ Validação completa:** Todos os passos (10 min)

