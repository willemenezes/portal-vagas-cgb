# 📋 Documentação Sistema de Vagas CGB Energia

## 📖 Índice Geral

### 📚 Documentação Funcional
- [Visão Geral do Sistema](./01-visao-geral.md)
- [Funcionalidades por Módulo](./02-funcionalidades.md)
- [Fluxos de Trabalho](./03-fluxos.md)
- [Controle de Acesso](./04-permissoes.md)

### 🔧 Documentação Técnica
- [Arquitetura do Sistema](./05-arquitetura.md)
- [Estrutura do Banco de Dados](./06-banco-dados.md)
- [APIs e Integrações](./07-apis.md)
- [Deploy e Configuração](./08-deploy.md)

### 🚀 Expansões e Melhorias
- [Guia de Futuras Expansões](./09-expansoes.md)
- [Roadmap de Desenvolvimento](./10-roadmap.md)
- [Arquitetura para Escala](./11-escalabilidade.md)

### 🛠️ Manutenção
- [Troubleshooting](./12-troubleshooting.md)
- [Monitoramento e Logs](./13-monitoramento.md)
- [Backup e Recovery](./14-backup.md)

---

## 🎯 Sobre o Sistema

O **Sistema de Vagas CGB Energia** é uma plataforma completa para gestão de processos seletivos, desenvolvida especificamente para atender às necessidades da CGB Energia. 

### Principais Características
- ✅ **Portal Público** para candidaturas
- ✅ **Portal Administrativo** completo
- ✅ **Validação Jurídica** integrada
- ✅ **Controle Geográfico** por estados/cidades
- ✅ **Auditoria Completa** de todas as ações
- ✅ **Interface Kanban** para processos seletivos
- ✅ **Comunicação Integrada** (Email/WhatsApp)

### Tecnologias Utilizadas
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **UI**: shadcn/ui + Tailwind CSS
- **State**: TanStack Query

---

## 🚀 Quick Start

### Para Usuários
1. Acesse o portal público para ver vagas disponíveis
2. Faça sua candidatura preenchendo o formulário
3. Acompanhe o status através do email fornecido

### Para Administradores
1. Acesse `/admin` com suas credenciais
2. Gerencie vagas na seção "Gestão de Vagas"
3. Acompanhe candidatos em "Processos Seletivos"

### Para Jurídico
1. Acesse `/admin` com credenciais jurídicas
2. Use a seção "Validação Legal" para aprovar/reprovar candidatos
3. Adicione observações quando necessário

---

## 📞 Suporte

Para dúvidas ou problemas:
- **Email**: suporte@cgbenergia.com.br
- **Documentação**: Esta pasta `docs/`
- **Issues**: [Repositório GitHub]

---

*Última atualização: 27/12/2024* 