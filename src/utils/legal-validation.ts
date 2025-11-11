// Utilitários para validação jurídica

// Validar CPF
export function validateCPF(cpf: string): boolean {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');

    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // Validação dos dígitos verificadores
    let sum = 0;
    let remainder;

    // Primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;

    // Segundo dígito verificador
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;

    return true;
}

// Formatar CPF
export function formatCPF(cpf: string): string {
    cpf = cpf.replace(/[^\d]/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Formatar RG
export function formatRG(rg: string): string {
    rg = rg.replace(/[^\dX]/gi, '');
    // Formato genérico, pode variar por estado
    if (rg.length === 9) {
        return rg.replace(/(\d{2})(\d{3})(\d{3})(\dX?)/, '$1.$2.$3-$4');
    }
    return rg;
}

// Validar data de nascimento (maior de idade)
export function validateBirthDate(birthDate: string): boolean {
    const date = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        return age - 1 >= 18;
    }

    return age >= 18;
}

// Validar nome completo (mínimo 2 palavras)
export function validateFullName(name: string): boolean {
    const words = name.trim().split(/\s+/);
    return words.length >= 2 && words.every(word => word.length >= 2);
}

// Mascarar CPF para exibição
export function maskCPF(cpf: string): string {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11) return cpf;
    return `${cpf.substring(0, 3)}.***.**-${cpf.substring(9)}`;
}

// Mascarar RG para exibição
export function maskRG(rg: string): string {
    if (rg.length < 4) return rg;
    return `${rg.substring(0, 2)}****${rg.substring(rg.length - 2)}`;
}

/**
 * Verifica se uma data é um dia útil (segunda a sexta)
 */
function isBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    // 0 = domingo, 6 = sábado
    return dayOfWeek !== 0 && dayOfWeek !== 6;
}

/**
 * Verifica se uma data é feriado nacional (lista básica)
 * TODO: Pode ser expandido para incluir mais feriados ou buscar de uma tabela
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

    // Carnaval (48 dias antes da Páscoa)
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
 * Ajusta a data de início considerando a regra das 16h:
 * Se a data for após as 16h, retorna o próximo dia útil
 */
function adjustStartDate(date: Date): Date {
    const hour = date.getHours();
    
    // Se for após as 16h, começar a contagem no próximo dia útil
    if (hour >= 16) {
        let nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        
        // Encontrar o próximo dia útil
        while (!isBusinessDay(nextDay) || isHoliday(nextDay)) {
            nextDay.setDate(nextDay.getDate() + 1);
        }
        
        return nextDay;
    }
    
    // Se for antes das 16h, usar a data atual
    const adjustedDate = new Date(date);
    adjustedDate.setHours(0, 0, 0, 0);
    
    // Se não for dia útil, ir para o próximo
    if (!isBusinessDay(adjustedDate) || isHoliday(adjustedDate)) {
        while (!isBusinessDay(adjustedDate) || isHoliday(adjustedDate)) {
            adjustedDate.setDate(adjustedDate.getDate() + 1);
        }
    }
    
    return adjustedDate;
}

/**
 * Calcula a diferença em dias úteis entre duas datas
 * Não conta o dia inicial se ainda não passou um dia completo
 */
function getBusinessDaysDifference(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    // Se for o mesmo dia, retornar 0 (ainda não passou 1 dia útil)
    if (current.getTime() === end.getTime()) {
        return 0;
    }
    
    // Começar a contar do dia seguinte ao dia inicial
    current.setDate(current.getDate() + 1);
    
    while (current <= end) {
        if (isBusinessDay(current) && !isHoliday(current)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    
    return count;
}

/**
 * Calcula o tempo decorrido em dias úteis, considerando a regra das 16h
 * Retorna o texto formatado e se o prazo foi excedido (2 dias úteis = 48h)
 */
export function calculateBusinessDaysElapsed(
    startDate: string | null | undefined
): { text: string; isOverdue: boolean; businessDays: number } {
    if (!startDate) {
        return { text: 'Sem registro', isOverdue: false, businessDays: 0 };
    }

    try {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
            return { text: 'Data inválida', isOverdue: false, businessDays: 0 };
        }

        // Ajustar data de início considerando a regra das 16h
        const adjustedStart = adjustStartDate(start);
        const now = new Date();
        
        // Calcular dias úteis
        const businessDays = getBusinessDaysDifference(adjustedStart, now);
        
        // Prazo de 48h = 2 dias úteis
        const isOverdue = businessDays > 2;
        
        // Formatar texto
        if (businessDays === 0) {
            // Se ainda não passou 1 dia útil, mostrar horas/minutos
            const hours = Math.floor((now.getTime() - adjustedStart.getTime()) / (1000 * 60 * 60));
            const minutes = Math.floor((now.getTime() - adjustedStart.getTime()) / (1000 * 60)) % 60;
            
            if (hours < 1) {
                return { text: `${minutes} min`, isOverdue: false, businessDays: 0 };
            } else {
                return { text: `${hours}h ${minutes}min`, isOverdue: false, businessDays: 0 };
            }
        } else if (businessDays === 1) {
            return { text: '1 dia útil', isOverdue: false, businessDays: 1 };
        } else {
            return { text: `${businessDays} dias úteis`, isOverdue, businessDays };
        }
    } catch (error) {
        console.warn('Erro ao calcular dias úteis:', startDate, error);
        return { text: 'Erro no cálculo', isOverdue: false, businessDays: 0 };
    }
} 