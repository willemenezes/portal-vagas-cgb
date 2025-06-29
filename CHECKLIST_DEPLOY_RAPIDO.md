# ⚡ Checklist Rápido - Deploy Vercel + HostGator

## 🚀 **Preparação (5 min)**
- [ ] `npm run build` funcionando
- [ ] Criar `vercel.json` (SPA)
- [ ] `git push origin main`

## 🌐 **Vercel (10 min)**
- [ ] Import project do GitHub
- [ ] Framework: Vite, Output: dist
- [ ] Deploy inicial
- [ ] Configurar variáveis de ambiente
- [ ] Redeploy
- [ ] Testar URL .vercel.app

## 🌍 **Domínio (15 min)**
- [ ] Settings → Domains → Add Domain
- [ ] Enable Vercel DNS
- [ ] Copiar nameservers (ns1/ns2.vercel-dns.com)
- [ ] HostGator: Alterar nameservers
- [ ] Aguardar propagação (30min-24h)

## 🧪 **Teste Final**
- [ ] `https://seudominio.com.br` funciona
- [ ] HTTPS (cadeado verde)
- [ ] Site carrega completamente
- [ ] Responsivo mobile

## 🎯 **Resultado:**
✅ Site online em domínio personalizado  
✅ Deploy automático a cada push  
✅ HTTPS + CDN global  

---

**Tempo total:** 30min + propagação DNS 