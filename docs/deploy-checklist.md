# ✅ Checklist de Deploy - CGB Energia

## 🚀 Próximos Passos (em ordem)

### 1. **Configurar Variáveis de Ambiente no Vercel** ⚙️
- [ ] Ir para [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Clicar no projeto CGB Energia
- [ ] **Settings** → **Environment Variables**
- [ ] Adicionar `VITE_SUPABASE_URL`
- [ ] Adicionar `VITE_SUPABASE_ANON_KEY`
- [ ] Marcar para Production/Preview/Development

### 2. **Fazer Redeploy** 🔄
- [ ] **Deployments** → Clicar nos 3 pontos do último deploy
- [ ] Selecionar **Redeploy**
- [ ] Aguardar conclusão (2-3 minutos)

### 3. **Testar URL do Vercel** 🧪
- [ ] Abrir `https://seu-projeto.vercel.app`
- [ ] Verificar se carrega sem erros
- [ ] Testar login básico

### 4. **Configurar Domínio Personalizado** 🌐
- [ ] No Vercel: **Settings** → **Domains**
- [ ] **Add Domain** → Digite seu domínio
- [ ] Copiar registros DNS mostrados

### 5. **Configurar DNS na HostGator** 📡
- [ ] Login no cPanel da HostGator
- [ ] **Zona DNS** ou **DNS Zone Editor**
- [ ] Adicionar registro A: `@` → `76.76.19.19`
- [ ] Adicionar CNAME: `www` → `cname.vercel-dns.com`
- [ ] Salvar alterações

### 6. **Verificar Domínio** ✅
- [ ] Voltar ao Vercel e clicar **Verify**
- [ ] Aguardar propagação DNS (5min-48h)
- [ ] Testar `https://seudominio.com.br`

---

## 🎯 Resultado Esperado
✅ Site funcionando em domínio personalizado  
✅ HTTPS automático  
✅ Deploy automático a cada push no Git  
✅ Banco Supabase conectado  

## 📞 Se der problema:
1. Verifique os logs no Vercel: **Functions** → **View Function Logs**
2. Teste DNS: [whatsmydns.net](https://whatsmydns.net)
3. Me chame se precisar de ajuda! 😊 