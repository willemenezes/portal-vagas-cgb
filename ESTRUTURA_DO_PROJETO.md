# Estrutura de Pastas do Projeto CGB Vagas

Este documento descreve a organização das pastas e arquivos no projeto CGB Vagas, facilitando a navegação e o desenvolvimento.

## Visão Geral

O projeto é uma aplicação web moderna construída com React, TypeScript e Vite para o frontend, e Supabase para o backend (banco de dados, autenticação, functions).

## Estrutura Principal

A seguir, uma explicação detalhada das principais pastas na raiz do projeto:

### 📁 `src`
É a pasta mais importante, contendo todo o código-fonte da aplicação frontend.

- **`components/`**: Contém os componentes React reutilizáveis.
    - **`admin/`**: Componentes específicos do painel de administração.
    - **`ui/`**: Componentes de interface de usuário genéricos (botões, cards, etc.), baseados na biblioteca `shadcn/ui`.
- **`config/`**: Arquivos de configuração da aplicação, como a conexão com o Supabase.
- **`data/`**: Arquivos com dados estáticos, como listas de cidades e estados.
- **`hooks/`**: "Ganchos" (Hooks) customizados do React, que encapsulam lógicas de estado e efeitos colaterais (ex: `useAuth` para autenticação).
- **`integrations/`**: Códigos que integram a aplicação com serviços de terceiros.
    - **`supabase/`**: Configuração do cliente Supabase para comunicação com o backend.
- **`lib/`**: Bibliotecas de funções auxiliares, constantes e validadores. `utils.ts` é um exemplo comum aqui.
- **`pages/`**: Componentes que representam as páginas da aplicação (ex: `Login.tsx`, `Admin.tsx`). Cada arquivo aqui geralmente corresponde a uma rota da aplicação.
- **`types/`**: Definições de tipos TypeScript para garantir a consistência dos dados em toda a aplicação.
- **`utils/`**: Funções utilitárias que podem ser usadas em várias partes do projeto.
- **`App.tsx`**: O componente principal da aplicação, que organiza as rotas e os componentes de nível superior.
- **`main.tsx`**: O ponto de entrada da aplicação, onde o React é renderizado no HTML.

### 📁 `public`
Contém arquivos estáticos que são servidos diretamente pelo servidor, sem passar pelo processo de build do Vite. Ideal para imagens, favicons e `manifest.json`.

### 📁 `supabase`
Contém toda a configuração e os scripts relacionados ao backend no Supabase.

- **`functions/`**: Código para as "Edge Functions" (funções serverless) do Supabase. Usadas para tarefas que precisam ser executadas no lado do servidor.
- **`migrations/`**: Arquivos de migração do banco de dados. Cada arquivo representa uma alteração na estrutura do banco de dados (criar tabelas, adicionar colunas, etc.), permitindo o versionamento do schema.

### 📁 `docs` e 📁 `Documentação PROJETO`
Estas pastas contêm a documentação geral do projeto, guias de deploy, visão geral das funcionalidades e outros materiais de apoio.

---

## Arquivos de Configuração na Raiz

- **`package.json`**: Define os metadados do projeto, as dependências (pacotes) e os scripts (ex: `dev`, `build`).
- **`vite.config.ts`**: Arquivo de configuração do Vite, a ferramenta de build usada no projeto.
- **`tailwind.config.ts`**: Arquivo de configuração do Tailwind CSS, o framework de estilização.
- **`tsconfig.json`**: Arquivo de configuração do TypeScript, definindo como o código TypeScript deve ser compilado.
- **`vercel.json`**: Arquivo de configuração para deploy na plataforma Vercel.
- **Arquivos `.sql`**: Vários scripts SQL avulsos, provavelmente usados para desenvolvimento, testes ou correções manuais no banco de dados. 