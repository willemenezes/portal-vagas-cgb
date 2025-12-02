-- Script para VERIFICAR se a função está contando dias úteis corretamente
-- Este script mostra dia a dia o que está sendo contado

-- Teste detalhado: contar quantos dias úteis existem entre duas datas
WITH date_series AS (
    SELECT generate_series(
        '2025-12-02'::DATE,
        '2025-12-31'::DATE,
        '1 day'::INTERVAL
    )::DATE as dia
)
SELECT 
    dia,
    EXTRACT(ISODOW FROM dia) as dia_semana, -- 1=segunda, 7=domingo
    CASE EXTRACT(ISODOW FROM dia)
        WHEN 1 THEN 'Segunda'
        WHEN 2 THEN 'Terça'
        WHEN 3 THEN 'Quarta'
        WHEN 4 THEN 'Quinta'
        WHEN 5 THEN 'Sexta'
        WHEN 6 THEN 'Sábado'
        WHEN 7 THEN 'Domingo'
    END as nome_dia,
    is_holiday(dia) as e_feriado,
    CASE 
        WHEN EXTRACT(ISODOW FROM dia) IN (6, 7) THEN 'Fim de Semana'
        WHEN is_holiday(dia) THEN 'Feriado'
        ELSE 'Dia Útil'
    END as tipo_dia
FROM date_series
ORDER BY dia;

-- Contar quantos dias úteis existem entre 02/12 e 31/12
WITH date_series AS (
    SELECT generate_series(
        '2025-12-02'::DATE + INTERVAL '1 day', -- Começar do dia seguinte
        '2025-12-31'::DATE,
        '1 day'::INTERVAL
    )::DATE as dia
)
SELECT 
    COUNT(*) FILTER (WHERE EXTRACT(ISODOW FROM dia) NOT IN (6, 7) AND NOT is_holiday(dia)) as dias_uteis_entre_02_e_31,
    COUNT(*) FILTER (WHERE EXTRACT(ISODOW FROM dia) IN (6, 7)) as fins_de_semana,
    COUNT(*) FILTER (WHERE is_holiday(dia)) as feriados,
    COUNT(*) as total_dias_corridos
FROM date_series;

-- Testar a função add_business_days diretamente
WITH date_range AS (
    SELECT generate_series(
        ('2025-12-02'::DATE + INTERVAL '1 day')::DATE,
        add_business_days('2025-12-02 13:05:18'::TIMESTAMP WITH TIME ZONE, 20)::DATE,
        '1 day'::INTERVAL
    )::DATE as dia
)
SELECT 
    '2025-12-02 13:05:18'::TIMESTAMP WITH TIME ZONE as data_criacao,
    add_business_days('2025-12-02 13:05:18'::TIMESTAMP WITH TIME ZONE, 20) as data_expiracao,
    COUNT(*) FILTER (WHERE EXTRACT(ISODOW FROM dia) NOT IN (6, 7) AND NOT is_holiday(dia)) as dias_uteis_contados,
    COUNT(*) as total_dias_no_periodo
FROM date_range;

