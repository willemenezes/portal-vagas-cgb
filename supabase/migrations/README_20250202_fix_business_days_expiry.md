# Migração: Corrigir Cálculo de Data de Expiração para Dias Úteis

**Data:** 02 de Fevereiro de 2025  
**Arquivo:** `20250202_fix_business_days_expiry.sql`

## Problema Identificado

O sistema estava calculando a data de expiração das vagas usando **20 dias corridos** (calendário), mas o requisito é **20 dias úteis** (excluindo fins de semana e feriados nacionais brasileiros).

### Exemplo do Problema:
- Vaga criada em: 01/12/2025 (segunda-feira) às 18:08
- Data de expiração INCORRETA: 21/12/2025 (20 dias corridos = inclui fins de semana)
- Data de expiração CORRETA: 31/12/2025 (20 dias úteis = exclui fins de semana e feriados)

## Solução Implementada

A migração cria 3 novas funções PostgreSQL:

1. **`is_holiday(DATE)`**: Verifica se uma data é feriado nacional brasileiro
   - Feriados fixos: Ano Novo, Tiradentes, Trabalho, Independência, N. Sra. Aparecida, Finados, Proclamação, Natal
   - Feriados móveis: Carnaval, Sexta-feira Santa, Corpus Christi (calculados baseado na Páscoa)

2. **`add_business_days(TIMESTAMP, INT)`**: Adiciona N dias úteis a uma data
   - Exclui sábados e domingos
   - Exclui feriados nacionais

3. **`calculate_expiry_date()`**: ATUALIZADA para usar `add_business_days(NOW(), 20)`
   - Substitui o antigo `NOW() + INTERVAL '20 days'`

## Como Aplicar a Migração

### Opção 1: Via Dashboard do Supabase (RECOMENDADO)

1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Navegue até: **SQL Editor**
3. Abra o arquivo `supabase/migrations/20250202_fix_business_days_expiry.sql`
4. Copie todo o conteúdo e cole no SQL Editor
5. Clique em **Run** (executar)
6. Verifique se apareceu a mensagem: "Vagas ativas atualizadas com nova data de expiração: X"

### Opção 2: Via CLI do Supabase

```bash
# Se você tem o Supabase CLI instalado
supabase db push
```

## O que a Migração Faz

1. ✅ Cria função `is_holiday()` para detectar feriados brasileiros
2. ✅ Cria função `add_business_days()` para adicionar dias úteis
3. ✅ Atualiza função `calculate_expiry_date()` para usar dias úteis
4. ✅ **IMPORTANTE:** Recalcula a data de expiração de TODAS as vagas ativas existentes
   - Baseado na data de criação + 20 dias úteis
   - Apenas vagas com `flow_status = 'ativa'` e que ainda não expiraram

## Impacto

- **Vagas novas:** Automaticamente terão a data de expiração correta (20 dias úteis)
- **Vagas ativas existentes:** Serão recalculadas para refletir 20 dias úteis desde a criação
- **Vagas concluídas/congeladas:** Não serão alteradas

## Verificação Após Migração

Execute esta query para verificar:

```sql
SELECT 
    id,
    title,
    created_at,
    expires_at,
    flow_status,
    (expires_at - created_at) as dias_diferenca
FROM public.jobs
WHERE flow_status = 'ativa'
ORDER BY created_at DESC
LIMIT 10;
```

**Esperado:** A diferença entre `created_at` e `expires_at` deve ser maior que 20 dias corridos (porque exclui fins de semana e feriados).

## Rollback (Reverter Migração)

Se houver algum problema, você pode reverter para dias corridos:

```sql
-- ATENÇÃO: Use apenas se necessário reverter
CREATE OR REPLACE FUNCTION calculate_expiry_date()
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE SQL
AS $$
  SELECT (NOW() + INTERVAL '20 days');
$$;
```

## Suporte

Em caso de dúvidas ou problemas:
1. Verifique os logs do Supabase
2. Execute a query de verificação acima
3. Contate o desenvolvedor responsável

