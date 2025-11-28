import { differenceInBusinessDays } from 'date-fns';

/**
 * Verifica se uma data é um dia útil (segunda a sexta)
 */
function isBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    // 0 = domingo, 6 = sábado
    return dayOfWeek !== 0 && dayOfWeek !== 6;
}

/**
 * Verifica se uma data é feriado nacional brasileiro
 * Inclui feriados fixos e móveis (baseados na Páscoa)
 */
function isHoliday(date: Date): boolean {
    const month = date.getMonth() + 1; // getMonth() retorna 0-11
    const day = date.getDate();
    const year = date.getFullYear();

    // Feriados fixos
    const fixedHolidays = [
        { month: 1, day: 1 },   // Ano Novo
        { month: 4, day: 21 },  // Tiradentes
        { month: 5, day: 1 },   // Dia do Trabalhador
        { month: 9, day: 7 },   // Independência
        { month: 10, day: 12 }, // Nossa Senhora Aparecida
        { month: 11, day: 2 },  // Finados
        { month: 11, day: 15 }, // Proclamação da República
        { month: 12, day: 25 }, // Natal
    ];

    // Verificar feriados fixos
    if (fixedHolidays.some(h => h.month === month && h.day === day)) {
        return true;
    }

    // Feriados móveis (Páscoa e derivados)
    // Cálculo simplificado da Páscoa (algoritmo de Meeus/Jones/Butcher)
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const n = Math.floor((h + l - 7 * m + 114) / 31);
    const p = (h + l - 7 * m + 114) % 31;
    const easterDay = p + 1;
    const easterMonth = n;

    // Carnaval (48 dias antes da Páscoa) - geralmente cai em terça-feira
    const carnivalDate = new Date(year, easterMonth - 1, easterDay);
    carnivalDate.setDate(carnivalDate.getDate() - 48);
    if (carnivalDate.getMonth() + 1 === month && carnivalDate.getDate() === day) {
        return true;
    }

    // Sexta-feira Santa (2 dias antes da Páscoa)
    const goodFridayDate = new Date(year, easterMonth - 1, easterDay);
    goodFridayDate.setDate(goodFridayDate.getDate() - 2);
    if (goodFridayDate.getMonth() + 1 === month && goodFridayDate.getDate() === day) {
        return true;
    }

    // Corpus Christi (60 dias após a Páscoa)
    const corpusChristiDate = new Date(year, easterMonth - 1, easterDay);
    corpusChristiDate.setDate(corpusChristiDate.getDate() + 60);
    if (corpusChristiDate.getMonth() + 1 === month && corpusChristiDate.getDate() === day) {
        return true;
    }

    return false;
}

/**
 * Calcula a diferença em dias úteis entre uma data alvo e uma data de referência,
 * excluindo fins de semana E feriados nacionais brasileiros.
 * Retorna valores negativos quando a data alvo já passou.
 */
export function calculateBusinessDaysUntil(
    targetDateInput: string | Date | null | undefined,
    referenceDate: Date = new Date()
): number | null {
    if (!targetDateInput) {
        return null;
    }

    const targetDate = new Date(targetDateInput);
    if (isNaN(targetDate.getTime())) {
        return null;
    }

    const reference = new Date(referenceDate);

    // Normalizar para o início do dia para evitar variações devido às horas
    targetDate.setHours(0, 0, 0, 0);
    reference.setHours(0, 0, 0, 0);

    // Se for a mesma data, retornar 0
    if (targetDate.getTime() === reference.getTime()) {
        return 0;
    }

    // Determinar direção (futuro ou passado)
    const isFuture = targetDate > reference;
    const start = isFuture ? new Date(reference) : new Date(targetDate);
    const end = isFuture ? new Date(targetDate) : new Date(reference);

    // Contar dias úteis (excluindo fins de semana e feriados)
    let count = 0;
    const current = new Date(start);
    
    // Avançar para o próximo dia se necessário
    if (isFuture) {
        current.setDate(current.getDate() + 1);
    } else {
        current.setDate(current.getDate() - 1);
    }

    while (isFuture ? current <= end : current >= end) {
        if (isBusinessDay(current) && !isHoliday(current)) {
            count++;
        }
        
        if (isFuture) {
            current.setDate(current.getDate() + 1);
        } else {
            current.setDate(current.getDate() - 1);
        }
    }

    // Retornar negativo se a data já passou
    return isFuture ? count : -count;
}

/**
 * Retorna o texto padronizado para exibição de prazos em dias úteis.
 */
export function formatBusinessDaysLabel(daysDiff: number): string {
    if (daysDiff < 0) {
        const abs = Math.abs(daysDiff);
        return abs === 1
            ? 'Expirada há 1 dia útil'
            : `Expirada há ${abs} dias úteis`;
    }

    if (daysDiff === 0) {
        return 'Expira hoje';
    }

    if (daysDiff === 1) {
        return 'Expira no próximo dia útil';
    }

    return `${daysDiff} dias úteis restantes`;
}

