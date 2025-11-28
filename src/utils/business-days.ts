import { differenceInBusinessDays } from 'date-fns';

/**
 * Calcula a diferença em dias úteis entre uma data alvo e uma data de referência.
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

    return differenceInBusinessDays(targetDate, reference);
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

