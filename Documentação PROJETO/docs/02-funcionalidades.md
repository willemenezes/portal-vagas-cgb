# 📊 Funcionalidades por Módulo

## 🏠 Portal Público

### 1. Mapa Interativo de Vagas
**Localização**: Página inicial (`/`)

**Funcionalidades**:
- ✅ Plotagem de vagas por coordenadas geográficas
- ✅ Clusters automáticos para múltiplas vagas na mesma cidade
- ✅ Popup com informações básicas da vaga
- ✅ Filtros por estado e cidade
- ✅ Zoom automático baseado na localização do usuário

**Como Usar**:
1. Acesse a página inicial
2. Visualize as vagas plotadas no mapa
3. Clique em um marcador para ver detalhes
4. Use os filtros na lateral para refinar a busca

### 2. Lista de Vagas
**Localização**: Página inicial (abaixo do mapa)

**Funcionalidades**:
- ✅ Grid responsivo de cards de vagas
- ✅ Informações: título, localização, tipo, data
- ✅ Filtros: cidade, estado, tipo de contrato
- ✅ Busca por texto livre
- ✅ Ordenação por data de publicação

**Campos Exibidos**:
- Título da vaga
- Cidade e estado
- Tipo de contrato (CLT, PJ, Estágio)
- Data de publicação
- Departamento

### 3. Detalhes da Vaga
**Localização**: `/job/:id`

**Funcionalidades**:
- ✅ Descrição completa da vaga
- ✅ Requisitos obrigatórios e desejáveis
- ✅ Benefícios oferecidos
- ✅ Informações sobre a empresa
- ✅ Botão "Candidatar-se"

### 4. Formulário de Candidatura
**Localização**: `/application/:jobId`

**Seções do Formulário**:

#### Dados Pessoais
- Nome completo
- Email
- Telefone/WhatsApp
- Cidade e estado de residência
- Idade

#### Dados Profissionais
- Cargo desejado
- Já trabalhou na CGB? (Sim/Não)
- Upload de currículo (PDF, max 5MB)

#### Informações de Transporte
- Possui CNH? (A, B, C, D, E, Não possui)
- Possui veículo próprio?
- Modelo e ano do veículo (se aplicável)
- Disponibilidade para viagens

#### Informações Especiais
- Pessoa com deficiência (PCD)?
- Disponibilidade para mudança
- Pretensão salarial

#### LGPD
- ✅ Consentimento obrigatório para tratamento de dados
- ✅ Link para política de privacidade

**Validações**:
- Campos obrigatórios marcados
- Formato de email válido
- Telefone no formato brasileiro
- Arquivo PDF válido para currículo
- Consentimento LGPD obrigatório

---

## 🔐 Portal Administrativo

### 1. Dashboard Principal
**Localização**: `/admin`
**Acesso**: Admin, RH, Gerência

**Métricas Principais**:
- 📊 Total de vagas ativas
- 👥 Total de candidatos
- ✅ Candidatos aprovados este mês
- ⏱️ Tempo médio de contratação
- 📈 Taxa de conversão por etapa

**Gráficos**:
- **Funil de Conversão**: Candidatos por etapa do processo
- **Linha do Tempo**: Contratações nos últimos 6 meses
- **Pizza**: Distribuição de candidatos por status
- **Barras**: Top 5 vagas com mais candidatos

**Filtros**:
- Período (último mês, trimestre, ano)
- Estado/cidade (baseado nas permissões do usuário)
- Departamento

### 2. Gestão de Vagas
**Localização**: `/admin/jobs`
**Acesso**: Admin, RH

#### 2.1 Lista de Vagas
**Funcionalidades**:
- ✅ Visualização em tabela com paginação
- ✅ Filtros: status, cidade, departamento, data
- ✅ Busca por título ou descrição
- ✅ Ações: editar, pausar, excluir, duplicar

**Colunas da Tabela**:
- Título
- Localização (cidade/estado)
- Departamento
- Tipo de contrato
- Status (ativa, pausada, finalizada)
- Data de criação
- Candidatos (quantidade)
- Ações

#### 2.2 Criar/Editar Vaga
**Formulário Completo**:

**Informações Básicas**:
- Título da vaga
- Departamento
- Cidade e estado
- Tipo de contrato
- Carga horária

**Descrição**:
- Descrição detalhada da função
- Principais responsabilidades
- Perfil ideal do candidato

**Requisitos**:
- Requisitos obrigatórios (array)
- Requisitos desejáveis (array)
- Experiência mínima necessária

**Benefícios**:
- Lista de benefícios oferecidos
- Informações sobre salário (opcional)

**Configurações**:
- Status da vaga
- Data de expiração
- Visibilidade (pública/interna)

### 3. Gestão de Candidatos
**Localização**: `/admin/candidates`
**Acesso**: Admin, RH, Gerência

#### 3.1 Lista de Candidatos
**Funcionalidades**:
- ✅ Tabela com paginação e busca
- ✅ Filtros avançados por múltiplos critérios
- ✅ Exportação para CSV/Excel
- ✅ Ações em lote (mover status, enviar email)

**Filtros Disponíveis**:
- Status do processo
- Vaga aplicada
- Cidade/estado
- Idade
- CNH
- PCD
- Data de aplicação

**Colunas da Tabela**:
- Nome
- Email
- Telefone
- Vaga aplicada
- Status atual
- Data de aplicação
- Tempo no status atual
- Ações

#### 3.2 Detalhes do Candidato
**Modal Completo com Abas**:

**Aba: Detalhes**
- Informações pessoais completas
- Dados de contato
- Informações da vaga aplicada
- Dados de transporte
- Link para download do currículo

**Aba: Histórico**
- Timeline completa de todas as ações
- Mudanças de status com data/hora
- Comunicações enviadas
- Validações jurídicas com comentários
- Notas adicionadas pela equipe

**Aba: Comunicação**
- Envio de emails com templates
- Envio de mensagens WhatsApp
- Histórico de comunicações
- Templates personalizáveis

### 4. Processos Seletivos (Kanban)
**Localização**: `/admin/selection`
**Acesso**: Admin, RH

#### 4.1 Interface Kanban
**Funcionalidades**:
- ✅ Drag & Drop entre colunas
- ✅ Filtro por vaga específica
- ✅ Abas: Ativos, Reprovados, Contratados
- ✅ Contador de candidatos por coluna
- ✅ Tempo em cada etapa

**Colunas do Processo**:
1. **Cadastrado**: Candidatos recém-inscritos
2. **Análise de Currículo**: Triagem inicial
3. **Pré-selecionado**: Aprovados na triagem
4. **Entrevista com RH**: Primeira entrevista
5. **Entrevista com Gestor**: Entrevista técnica
6. **Teste Técnico**: Avaliação específica
7. **Aguardando Retorno**: Decisão pendente
8. **Validação TJ**: Análise jurídica
9. **Validação Frota**: Aprovação final
10. **Aprovado**: Candidato selecionado
11. **Contratado**: Processo finalizado
12. **Reprovado**: Não selecionado

#### 4.2 Regras de Negócio
**Bloqueios Automáticos**:
- ❌ Candidatos em "Validação TJ" só podem sair após aprovação jurídica
- ❌ Movimentação para "Reprovado" exige motivo obrigatório
- ✅ Histórico automático de todas as movimentações

#### 4.3 Cards dos Candidatos
**Informações Exibidas**:
- Avatar com iniciais
- Nome do candidato
- Tempo na etapa atual
- Ícone de status jurídico (quando aplicável)

### 5. Gestão de Usuários RH
**Localização**: `/admin/users`
**Acesso**: Admin

#### 5.1 Lista de Usuários
**Funcionalidades**:
- ✅ Visualização de todos os usuários RH
- ✅ Filtros por role e status
- ✅ Busca por nome ou email
- ✅ Ações: editar, desativar, resetar senha

#### 5.2 Criar/Editar Usuário
**Formulário**:
- Nome completo
- Email corporativo
- Role (Admin, RH, Gerência, Jurídico)
- Estados atribuídos
- Cidades atribuídas
- Status (ativo/inativo)

**Validação de Senha Rigorosa**:
- Mínimo 8 caracteres
- Pelo menos 1 letra minúscula
- Pelo menos 1 letra maiúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial
- Confirmação obrigatória

### 6. Validação Legal
**Localização**: `/admin/legal`
**Acesso**: Jurídico

#### 6.1 Interface Específica
**Funcionalidades**:
- ✅ Lista de candidatos aguardando validação
- ✅ Visualização completa dos dados do candidato
- ✅ Informações detalhadas da vaga
- ✅ Seção expansível com dados completos

#### 6.2 Dados Exibidos
**Informações Principais**:
- Nome e dados de contato
- Vaga aplicada (título, cidade, departamento)
- Data de aplicação

**Detalhes Expandidos**:
- **Dados da Vaga**: Tipo, carga horária, descrição
- **Dados Pessoais**: Idade, PCD, localização
- **Transporte**: CNH, veículo, modelo/ano
- **Histórico CGB**: Se já trabalhou na empresa

#### 6.3 Ações de Validação
**Opções Disponíveis**:
- ✅ **Aprovar**: Libera para próxima etapa
- ❌ **Reprovar**: Bloqueia com motivo obrigatório
- ⚠️ **Aprovar com Restrição**: Aprova com observações

**Funcionalidades**:
- Comentários obrigatórios para reprovação/restrição
- Modal de confirmação com resumo
- Histórico automático de todas as validações

### 7. Banco de Talentos
**Localização**: `/admin/talent-bank`
**Acesso**: Admin, RH

**Funcionalidades**:
- ✅ Pool de candidatos aprovados
- ✅ Busca avançada por skills
- ✅ Filtros por localização e experiência
- ✅ Convite para novas vagas
- ✅ Histórico de participações

### 8. Relatórios e Analytics
**Localização**: `/admin/reports`
**Acesso**: Admin, RH, Gerência

#### 8.1 Relatórios Disponíveis
- **Funil de Conversão**: Por período e vaga
- **Tempo por Etapa**: Identificação de gargalos
- **Performance por Vaga**: Métricas detalhadas
- **Análise Geográfica**: Distribuição regional
- **Eficiência do RH**: Produtividade da equipe

#### 8.2 Exportação
- Formato CSV para análise externa
- Filtros personalizáveis
- Agendamento de relatórios automáticos

---

## 🔐 Controle de Acesso

### Roles e Permissões

#### Admin
- ✅ Acesso total a todas as funcionalidades
- ✅ Gestão de usuários
- ✅ Configurações do sistema
- ✅ Sem restrições geográficas

#### RH
- ✅ Gestão de candidatos
- ✅ Processos seletivos
- ✅ Comunicação
- ✅ Relatórios básicos
- ❌ Limitado por territórios atribuídos

#### Gerência
- ✅ Visualização de candidatos
- ✅ Relatórios
- ✅ Aprovação de entrevistas
- ❌ Sem edição de dados

#### Jurídico
- ✅ Validação legal exclusiva
- ✅ Histórico de validações
- ✅ Sem restrições geográficas
- ❌ Sem acesso a outras funcionalidades

---

## 📱 Responsividade

Todas as funcionalidades são **100% responsivas**:
- 📱 **Mobile**: Interface otimizada para smartphones
- 📟 **Tablet**: Layout adaptado para tablets
- 💻 **Desktop**: Experiência completa

---

*Documentação atualizada em: 27/12/2024* 