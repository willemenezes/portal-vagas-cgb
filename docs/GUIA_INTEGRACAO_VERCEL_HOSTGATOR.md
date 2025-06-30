# 🚀 Guia Completo: Integração Vercel + HostGator

## 📋 **Visão Geral**
Este guia documenta o processo completo para colocar um projeto React/Vite online usando Vercel (hospedagem) + HostGator (domínio).

---

## ✅ **Pré-requisitos**

### **Necessário ter:**
- [x] Projeto React/Vite desenvolvido
- [x] Conta no GitHub
- [x] Conta no Vercel
- [x] Domínio registrado na HostGator
- [x] Build do projeto funcionando (`npm run build`)

---

## 🔧 **ETAPA 1: Preparação do Projeto**

### **1.1 - Configurações de Build**
```bash
# Testar o build localmente
npm run build
npm run preview
```

### **1.2 - Arquivo vercel.json (para SPAs)**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### **1.3 - Enviar para GitHub**
```bash
git add .
git commit -m "🚀 Preparação para deploy"
git push origin main
```

---

## 🌐 **ETAPA 2: Deploy no Vercel**

### **2.1 - Conectar Repositório**
1. Acesse [vercel.com](https://vercel.com)
2. **Import Project**
3. Conecte sua conta GitHub
4. Selecione o repositório
5. Configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. **Deploy**

### **2.2 - Configurar Variáveis de Ambiente**
1. **Settings** → **Environment Variables**
2. Adicione as variáveis necessárias:
   ```
   # Exemplo para Supabase
   SUPABASE_URL=sua_url_aqui
   SUPABASE_ANON_KEY=sua_key_aqui
   ```
3. Marque para **Production**, **Preview** e **Development**
4. **Save**

### **2.3 - Redeploy (se necessário)**
1. **Deployments** → **3 pontos** → **Redeploy**

---

## 🌍 **ETAPA 3: Configuração do Domínio**

### **3.1 - Adicionar Domínio no Vercel**
1. **Settings** → **Domains**
2. **Add Domain**
3. Digite seu domínio: `seudominio.com.br`
4. **Add**

### **3.2 - Escolher Método de DNS**

#### **🎯 MÉTODO 1: Vercel DNS (RECOMENDADO)**

**3.2.1 - Habilitar Vercel DNS:**
1. Clique em **"Enable Vercel DNS"**
2. Copie os nameservers:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

**3.2.2 - Configurar na HostGator:**
1. **Login no painel HostGator**
2. **Gerenciar Domínios**
3. **Nameservers** ou **Servidores de Nomes**
4. **Alterar para:**
   ```
   Nameserver 1: ns1.vercel-dns.com
   Nameserver 2: ns2.vercel-dns.com
   ```
5. **Salvar**

#### **🔧 MÉTODO 2: DNS Manual (Alternativo)**

**3.2.1 - Configurar registros DNS na HostGator:**
1. **cPanel** → **Zona DNS**
2. **Adicionar registros:**
   ```
   Tipo: A
   Nome: @
   Valor: 76.76.19.19
   TTL: 3600
   
   Tipo: CNAME
   Nome: www
   Valor: cname.vercel-dns.com
   TTL: 3600
   ```

---

## ⏰ **ETAPA 4: Propagação e Testes**

### **4.1 - Tempo de Propagação**
- **Mínimo:** 15-30 minutos
- **Médio:** 1-2 horas
- **Máximo:** 24-48 horas

### **4.2 - Como Testar**
1. **Aguardar 30 minutos**
2. **Testar URLs:**
   - `https://seudominio.com.br`
   - `https://www.seudominio.com.br`
3. **Verificar propagação:** [whatsmydns.net](https://whatsmydns.net)
4. **Confirmar HTTPS:** Verificar cadeado verde

### **4.3 - Troubleshooting**
- **Erro 404:** Verificar arquivo `vercel.json`
- **Erro SSL:** Aguardar propagação
- **Site não carrega:** Verificar registros DNS
- **Erro de build:** Verificar logs no Vercel

---

## 🔍 **ETAPA 5: Verificações Finais**

### **5.1 - Checklist de Funcionamento**
- [ ] Site carrega sem erros
- [ ] HTTPS funcionando (cadeado verde)
- [ ] Todas as páginas acessíveis
- [ ] Responsividade mobile
- [ ] Formulários funcionando
- [ ] APIs conectadas
- [ ] Performance aceitável

### **5.2 - Monitoramento**
- **Vercel Analytics:** Métricas de performance
- **Error Tracking:** Logs de erro
- **Uptime Monitoring:** Disponibilidade

---

## 📊 **BENEFÍCIOS DESTA CONFIGURAÇÃO**

### ✅ **Vantagens:**
- 🚀 **Deploy automático** a cada push
- 🌍 **CDN global** (performance)
- 🔒 **HTTPS automático**
- 📱 **Edge computing**
- 🔄 **Rollback fácil**
- 📈 **Analytics integrado**
- 💰 **Custo baixo**

### ⚡ **Performance:**
- **Primeira carga:** < 2s
- **Navegação:** < 500ms
- **Uptime:** 99.9%

---

## 🆘 **Problemas Comuns e Soluções**

### **❌ Problema:** Variáveis de ambiente com erro
**✅ Solução:** Use nomes simples sem caracteres especiais

### **❌ Problema:** DNS não propaga
**✅ Solução:** Aguardar 24h, verificar nameservers

### **❌ Problema:** Erro 404 em rotas
**✅ Solução:** Verificar arquivo `vercel.json` com rewrites

### **❌ Problema:** Build falha
**✅ Solução:** Verificar dependências e scripts no package.json

---

## 📞 **Suporte e Recursos**

### **Documentações:**
- [Vercel Docs](https://vercel.com/docs)
- [HostGator Suporte](https://hostgator.com.br/suporte)

### **Ferramentas Úteis:**
- [whatsmydns.net](https://whatsmydns.net) - Verificar propagação DNS
- [gtmetrix.com](https://gtmetrix.com) - Testar performance
- [ssllabs.com](https://ssllabs.com) - Verificar SSL

---

## 💡 **Dicas Pro**

### **Otimizações:**
1. **Minificar assets** antes do deploy
2. **Lazy loading** para imagens
3. **Service Workers** para cache
4. **Compression** ativada no Vercel

### **Segurança:**
1. **Headers de segurança** no vercel.json
2. **CORS** configurado adequadamente
3. **Rate limiting** nas APIs
4. **Variáveis sensíveis** apenas no servidor

---

## 🎯 **Conclusão**

Este processo garante:
- ✅ Site profissional online
- ✅ Performance otimizada
- ✅ Domínio personalizado
- ✅ Deploy automatizado
- ✅ Escalabilidade

**Tempo total:** 30min - 2h (dependendo da propagação DNS)

---

*Criado baseado na implementação bem-sucedida do Portal CGB Vagas*  
*Data: Janeiro 2025* 