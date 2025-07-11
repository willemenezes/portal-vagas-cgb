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