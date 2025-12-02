-- Migração para corrigir o cálculo de data de expiração para usar dias úteis
-- Data: 02 de Fevereiro de 2025
-- PROBLEMA: A função calculate_expiry_date() estava adicionando 20 dias corridos (calendário)
-- SOLUÇÃO: Nova função que adiciona 20 dias ÚTEIS (excluindo fins de semana e feriados)

-- 1. Função para verificar se uma data é feriado nacional brasileiro
CREATE OR REPLACE FUNCTION is_holiday(check_date DATE)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    month INT;
    day INT;
    year INT;
    easter_date DATE;
    carnival_date DATE;
    good_friday_date DATE;
    corpus_christi_date DATE;
BEGIN
    month := EXTRACT(MONTH FROM check_date);
    day := EXTRACT(DAY FROM check_date);
    year := EXTRACT(YEAR FROM check_date);
    
    -- Feriados fixos
    IF (month = 1 AND day = 1) OR  -- Ano Novo
       (month = 4 AND day = 21) OR -- Tiradentes
       (month = 5 AND day = 1) OR  -- Dia do Trabalhador
       (month = 9 AND day = 7) OR  -- Independência
       (month = 10 AND day = 12) OR -- Nossa Senhora Aparecida
       (month = 11 AND day = 2) OR  -- Finados
       (month = 11 AND day = 15) OR -- Proclamação da República
       (month = 12 AND day = 25) THEN -- Natal
        RETURN TRUE;
    END IF;
    
    -- Cálculo da Páscoa (algoritmo de Meeus/Jones/Butcher)
    -- Simplificado para PostgreSQL
    DECLARE
        a INT := year % 19;
        b INT := year / 100;
        c INT := year % 100;
        d INT := b / 4;
        e INT := b % 4;
        f INT := (b + 8) / 25;
        g INT := (b - f + 1) / 3;
        h INT := (19 * a + b - d - g + 15) % 30;
        i INT := c / 4;
        k INT := c % 4;
        l INT := (32 + 2 * e + 2 * i - h - k) % 7;
        m INT := (a + 11 * h + 22 * l) / 451;
        easter_month INT := (h + l - 7 * m + 114) / 31;
        easter_day INT := ((h + l - 7 * m + 114) % 31) + 1;
    BEGIN
        easter_date := make_date(year, easter_month, easter_day);
        
        -- Carnaval (48 dias antes da Páscoa)
        carnival_date := easter_date - INTERVAL '48 days';
        IF check_date = carnival_date THEN
            RETURN TRUE;
        END IF;
        
        -- Sexta-feira Santa (2 dias antes da Páscoa)
        good_friday_date := easter_date - INTERVAL '2 days';
        IF check_date = good_friday_date THEN
            RETURN TRUE;
        END IF;
        
        -- Corpus Christi (60 dias após a Páscoa)
        corpus_christi_date := easter_date + INTERVAL '60 days';
        IF check_date = corpus_christi_date THEN
            RETURN TRUE;
        END IF;
    END;
    
    RETURN FALSE;
END;
$$;

-- 2. Função para adicionar N dias úteis a uma data
CREATE OR REPLACE FUNCTION add_business_days(start_date TIMESTAMP WITH TIME ZONE, days_to_add INT)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
DECLARE
    current_date DATE := start_date::DATE;
    business_days_added INT := 0;
BEGIN
    -- Adicionar dias úteis até atingir o número desejado
    WHILE business_days_added < days_to_add LOOP
        -- Avançar para o próximo dia
        current_date := current_date + INTERVAL '1 day';
        
        -- Verificar se é dia útil (não é sábado, domingo nem feriado)
        IF EXTRACT(ISODOW FROM current_date) NOT IN (6, 7) AND NOT is_holiday(current_date) THEN
            business_days_added := business_days_added + 1;
        END IF;
    END LOOP;
    
    -- Retornar a data com a mesma hora do start_date
    RETURN current_date::TIMESTAMP WITH TIME ZONE + (start_date::TIME - '00:00:00'::TIME);
END;
$$;

-- 3. Atualizar a função calculate_expiry_date para usar dias úteis
CREATE OR REPLACE FUNCTION calculate_expiry_date()
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE SQL
AS $$
  SELECT add_business_days(NOW(), 20);
$$;

-- 4. Comentários para documentação
COMMENT ON FUNCTION is_holiday(DATE) IS 'Verifica se uma data é feriado nacional brasileiro (fixo ou móvel)';
COMMENT ON FUNCTION add_business_days(TIMESTAMP WITH TIME ZONE, INT) IS 'Adiciona N dias úteis a uma data, excluindo fins de semana e feriados nacionais';
COMMENT ON FUNCTION calculate_expiry_date() IS 'Calcula a data de expiração da vaga (NOW + 20 dias ÚTEIS, excluindo fins de semana e feriados)';

-- 5. Atualizar vagas ATIVAS existentes que têm expires_at incorreto
-- IMPORTANTE: Só atualizar vagas que ainda não expiraram e estão ativas
-- Isso recalcula a data de expiração baseado na data de criação + 20 dias úteis
UPDATE public.jobs
SET expires_at = add_business_days(created_at, 20)
WHERE 
    flow_status = 'ativa' 
    AND expires_at IS NOT NULL
    AND expires_at > NOW()
    AND created_at IS NOT NULL;

-- 6. Log de vagas atualizadas
DO $$
DECLARE
    updated_count INT;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM public.jobs
    WHERE 
        flow_status = 'ativa' 
        AND expires_at IS NOT NULL
        AND expires_at > NOW()
        AND created_at IS NOT NULL;
    
    RAISE NOTICE 'Vagas ativas atualizadas com nova data de expiração: %', updated_count;
END $$;

