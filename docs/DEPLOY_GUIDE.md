# 🚀 Guia Completo de Deploy - CGB Energia Portal

## ✅ Status Atual
- [x] Build criado (`dist/`)
- [x] Projeto vinculado ao Git
- [x] Projeto vinculado ao Vercel
- [ ] Domínio configurado
- [ ] Variáveis de ambiente configuradas

## 🔧 1. Configurar Variáveis de Ambiente no Vercel

### Acesse as configurações do projeto:
1. Vá para [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique no seu projeto
3. Vá em **Settings** → **Environment Variables**

### Adicione as seguintes variáveis:
```
VITE_SUPABASE_URL = https://csgmamxhqkqdknohfsfj.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzZ21hbXhocWtxZGtub2hmc2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc5NDY2MjYsImV4cCI6MjAzMzUyMjYyNn0.vQJlmJNEQBjLQCGRgPfnGP-9hNXpFKDxnIjIm5Ew-_E
```

⚠️ **Importante**: Marque todas as variáveis para **Production**, **Preview** e **Development**

## 🌐 2. Configurar Domínio

### No Vercel:
1. **Settings** → **Domains**
2. **Add Domain** → Digite seu domínio (ex: `vagas.cgbenergia.com.br`)
3. Copie os registros DNS mostrados

### Na HostGator:
1. Acesse o **cPanel**
2. Vá em **Zona DNS** ou **DNS Zone Editor**
3. Configure conforme o arquivo `vercel-dns-setup.md`

## 🔄 3. Forçar Novo Deploy

Após configurar as variáveis:
1. Vá em **Deployments**
2. Clique nos **3 pontos** do último deploy
3. Selecione **Redeploy**

## 🧪 4. Testar o Site

### URLs de teste:
- **Vercel URL**: `https://seu-projeto.vercel.app`
- **Domínio customizado**: `https://seudominio.com.br`

### Pontos importantes para testar:
- [x] Página inicial carrega
- [x] Login funciona
- [x] Conexão com Supabase
- [x] Upload de arquivos
- [x] Mapa interativo
- [x] Responsividade mobile

## 🐛 5. Troubleshooting

### Se o site não carregar:
1. Verifique os **Function Logs** no Vercel
2. Confirme se as variáveis de ambiente estão corretas
3. Verifique se o DNS propagou: [whatsmydns.net](https://whatsmydns.net)

### Se houver erro 404:
- O arquivo `vercel.json` resolve rotas SPA automaticamente

### Se Supabase não conectar:
- Verifique se as variáveis VITE_SUPABASE_* estão corretas
- Confirme se o projeto foi redeployado após adicionar as variáveis

## 📊 6. Monitoramento

### Analytics do Vercel:
- Vá em **Analytics** para ver métricas de performance
- Configure **Alerts** para problemas

### Performance:
- Use **Lighthouse** para auditoria
- Monitore **Core Web Vitals**

## 🎉 Resultado Final

Após completar todos os passos:
- ✅ Site online em domínio personalizado
- ✅ HTTPS automático
- ✅ Deploy automático a cada push
- ✅ Backup e versionamento
- ✅ CDN global da Vercel

## 📞 Suporte

Se precisar de ajuda:
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **HostGator Suporte**: Painel do cliente
- **Documentação**: [vercel.com/docs](https://vercel.com/docs) 