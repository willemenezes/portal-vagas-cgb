# 🔐 Configuração de Variáveis de Ambiente - CGB Vagas

## ⚠️ CRÍTICO: Segurança das Chaves

As chaves hardcoded foram **REMOVIDAS** do código por questões de segurança. Agora o sistema usa **APENAS** variáveis de ambiente.

## 📋 Variáveis Necessárias

### **Para Desenvolvimento Local:**
Crie um arquivo `.env.local` na raiz do projeto com:

```bash
# URL do projeto Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave anônima do Supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

### **Para Produção (Vercel):**
Configure as variáveis no dashboard do Vercel:

1. Acesse: [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione o projeto `CGB VAGAS`
3. Vá em **Settings** → **Environment Variables**
4. Adicione:
   - `VITE_SUPABASE_URL` = `https://csgmamxhqkqdknohfsfj.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sua_chave_real_aqui`

## 🔍 Como Obter as Chaves

### **1. URL do Supabase:**
- Acesse: [Supabase Dashboard](https://supabase.com/dashboard)
- Selecione seu projeto
- Vá em **Settings** → **API**
- Copie a **Project URL**

### **2. Chave Anônima:**
- No mesmo local (Settings → API)
- Copie a **anon public** key
- ⚠️ **NUNCA** use a **service_role** key no frontend!

## ✅ Validação Automática

O sistema agora valida automaticamente se as variáveis estão definidas:

```typescript
// Se alguma variável estiver faltando, o sistema mostrará erro:
❌ VITE_SUPABASE_URL não está definida nas variáveis de ambiente
❌ VITE_SUPABASE_ANON_KEY não está definida nas variáveis de ambiente
```

## 🚀 Deploy Seguro

### **Antes do Deploy:**
1. ✅ Verificar se `.env.local` existe (desenvolvimento)
2. ✅ Verificar se variáveis estão no Vercel (produção)
3. ✅ Testar localmente com `npm run dev`
4. ✅ Fazer deploy apenas após testes

### **Após o Deploy:**
1. ✅ Verificar se o site carrega normalmente
2. ✅ Testar login/logout
3. ✅ Verificar se dados são carregados
4. ✅ Monitorar logs de erro

## 🔒 Benefícios da Mudança

### **Antes (Inseguro):**
```typescript
// ❌ Chaves expostas no código
anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### **Depois (Seguro):**
```typescript
// ✅ Chaves em variáveis de ambiente
anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
```

## 📞 Suporte

Se encontrar problemas:

1. **Verificar** se as variáveis estão definidas
2. **Verificar** se os valores estão corretos
3. **Verificar** se o projeto Supabase está ativo
4. **Contatar** o administrador do sistema

---

**Data da Implementação**: ${new Date().toLocaleDateString('pt-BR')}
**Status**: ✅ Implementado
**Impacto**: 🔐 Correção crítica de segurança
