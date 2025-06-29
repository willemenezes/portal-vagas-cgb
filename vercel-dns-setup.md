# 🌐 Configuração DNS - HostGator → Vercel

## Registros DNS Necessários

### Para domínio principal (exemplo.com.br):
```
Tipo: A
Nome: @
Valor: 76.76.19.19

Tipo: CNAME  
Nome: www
Valor: cname.vercel-dns.com
```

### Para subdomínio (vagas.exemplo.com.br):
```
Tipo: CNAME
Nome: vagas
Valor: cname.vercel-dns.com
```

## Passos na HostGator:

1. **Acesse o cPanel da HostGator**
   - Login no painel da HostGator
   - Clique em "Zona DNS" ou "DNS Zone Editor"

2. **Remova registros existentes (se necessário)**
   - Delete registros A antigos apontando para o IP da HostGator
   - Delete registros CNAME conflitantes

3. **Adicione os novos registros**
   - Adicione o registro A para @ apontando para 76.76.19.19
   - Adicione o registro CNAME para www apontando para cname.vercel-dns.com

4. **Salve as alterações**

## ⏰ Tempo de Propagação
- DNS pode levar de 5 minutos a 48 horas para propagar
- Use [whatsmydns.net](https://whatsmydns.net) para verificar a propagação

## 🔧 Verificação
1. No Vercel, clique em "Verify" após configurar o DNS
2. Se der erro, aguarde a propagação e tente novamente
3. Quando verificado, o domínio ficará com status "Active"

## 🚀 Resultado Final
- Seu site estará disponível em: https://seudominio.com.br
- Redirecionamento automático de HTTP para HTTPS
- Certificado SSL gratuito do Vercel 