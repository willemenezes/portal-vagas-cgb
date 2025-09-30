# Instruções: Implementação de Prazo de 48h para Validação TJ

## O que foi implementado

Sistema automático para registrar **data e hora** quando um candidato chega na etapa "Validação TJ", permitindo ao jurídico visualizar:
- Quando o candidato chegou para validação
- Há quanto tempo está aguardando
- Alerta visual quando o prazo de 48h for excedido

## Como funciona

### 1. Trigger Automático no Banco de Dados
- Quando o status do candidato muda PARA "Validação TJ", o sistema automaticamente registra a data/hora
- Quando o status muda DE "Validação TJ" para outra etapa, o timestamp é limpo
- **Não é necessário alterar código frontend** - tudo funciona automaticamente

### 2. Exibição Visual
- **Card do candidato**: Mostra "Aguardando há: Xh Ymin" com ícone de relógio
- **Modal de detalhes**: Seção completa com:
  - Data/hora de chegada formatada
  - Tempo decorrido
  - Badge de alerta se passar de 48h
- **Alerta vermelho**: Quando prazo excedido, destaque visual em vermelho

## Passo a Passo para Ativar

### 1. Executar Migration SQL no Supabase

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Vá em **SQL Editor** (menu lateral)
3. Clique em **New Query**
4. Copie e cole o conteúdo do arquivo `supabase/migrations/20250131_add_tj_validation_timestamp.sql`
5. Clique em **Run** (ou pressione Ctrl+Enter)

### 2. Verificar se funcionou

Execute esta query no SQL Editor para confirmar:

```sql
-- Verificar se a coluna foi criada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'candidates' 
AND column_name = 'tj_validation_started_at';

-- Ver candidatos em Validação TJ com timestamp
SELECT 
  name, 
  status, 
  tj_validation_started_at,
  EXTRACT(EPOCH FROM (NOW() - tj_validation_started_at)) / 3600 as horas_decorridas
FROM candidates 
WHERE status = 'Validação TJ';
```

### 3. Testar no Frontend

1. Acesse o perfil **Jurídico**
2. Vá em **Validação de candidato**
3. Você verá:
   - Tempo decorrido em cada card de candidato
   - Badge vermelho se passar de 48h
   - No modal de detalhes, seção completa com prazo

## O que acontece com candidatos existentes?

A migration SQL **automaticamente define o timestamp como AGORA** para candidatos que já estão em "Validação TJ". Isso permite que o jurídico comece a usar o sistema imediatamente.

## Exemplos Visuais

### Card do Candidato
```
Gabriel daniel Silva souza
📋 Agente Comercial - Leitura
📍 Altamira, PA
🏢 Departamento
⏰ Aguardando há: 1d 5h  [Badge: Prazo excedido (48h)]
```

### Modal - Seção de Prazo
```
⏰ Prazo de Validação (48h)
Chegou em: 28/01/2025 14:30
Tempo decorrido: 2d 3h
⚠️ Prazo de 48h excedido
```

## Segurança e Performance

✅ **Trigger otimizado**: Só executa quando o campo `status` é alterado
✅ **Índice criado**: Performance otimizada para queries
✅ **Sem quebras**: Sistema continua funcionando normalmente, apenas adiciona informação
✅ **Reversível**: Se necessário, a coluna pode ser removida sem afetar outras funcionalidades

## Suporte

Se encontrar algum problema:
1. Verifique se a migration foi executada com sucesso
2. Confirme que o campo `tj_validation_started_at` existe na tabela `candidates`
3. Teste movendo um candidato manualmente para "Validação TJ"
4. Verifique o console do navegador para erros JavaScript

---

**Status**: ✅ Código commitado e enviado para `main`
**Próximo passo**: Executar SQL no Supabase Dashboard
