export const validateEmail = (email: string): boolean => {
    if (!email) return false;
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (!password) {
        return { valid: false, message: 'A senha não pode estar em branco.' };
    }
    if (password.length < 8) {
        return { valid: false, message: 'A senha deve ter pelo menos 8 caracteres.' };
    }
    if (!/(?=.*[a-z])/.test(password)) {
        return { valid: false, message: 'A senha deve conter pelo menos uma letra minúscula.' };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
        return { valid: false, message: 'A senha deve conter pelo menos uma letra maiúscula.' };
    }
    if (!/(?=.*\d)/.test(password)) {
        return { valid: false, message: 'A senha deve conter pelo menos um número.' };
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
        return { valid: false, message: 'A senha deve conter pelo menos um caractere especial (@$!%*?&).' };
    }
    return { valid: true };
}; 