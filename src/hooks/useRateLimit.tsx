import { useState, useEffect } from 'react';

interface RateLimitState {
    attempts: number;
    lastAttempt: number;
    blockedUntil?: number;
}

export const useRateLimit = (maxAttempts: number = 5, blockDurationMs: number = 15 * 60 * 1000) => {
    const [isBlocked, setIsBlocked] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    const [attemptsRemaining, setAttemptsRemaining] = useState(maxAttempts);

    const STORAGE_KEY = 'auth_rate_limit';

    const getRateLimitState = (): RateLimitState => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error reading rate limit state:', error);
        }
        return { attempts: 0, lastAttempt: 0 };
    };

    const setRateLimitState = (state: RateLimitState) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('Error saving rate limit state:', error);
        }
    };

    const checkRateLimit = () => {
        const state = getRateLimitState();
        const now = Date.now();

        // Se não há bloqueio anterior, permitir
        if (!state.blockedUntil) {
            setIsBlocked(false);
            setAttemptsRemaining(maxAttempts - state.attempts);
            return true;
        }

        // Se ainda está bloqueado
        if (now < state.blockedUntil) {
            setIsBlocked(true);
            setRemainingTime(Math.ceil((state.blockedUntil - now) / 1000));
            return false;
        }

        // Se o bloqueio expirou, resetar
        setRateLimitState({ attempts: 0, lastAttempt: 0 });
        setIsBlocked(false);
        setAttemptsRemaining(maxAttempts);
        return true;
    };

    const recordFailedAttempt = () => {
        const state = getRateLimitState();
        const now = Date.now();
        const newAttempts = state.attempts + 1;

        const newState: RateLimitState = {
            attempts: newAttempts,
            lastAttempt: now,
        };

        // Se excedeu o máximo de tentativas, bloquear
        if (newAttempts >= maxAttempts) {
            newState.blockedUntil = now + blockDurationMs;
            setIsBlocked(true);
            setRemainingTime(Math.ceil(blockDurationMs / 1000));
            console.warn('[SECURITY] Rate limit exceeded. IP blocked for', blockDurationMs / 60000, 'minutes');
        }

        setRateLimitState(newState);
        setAttemptsRemaining(Math.max(0, maxAttempts - newAttempts));
    };

    const recordSuccessfulAttempt = () => {
        // Limpar contador em caso de sucesso
        setRateLimitState({ attempts: 0, lastAttempt: 0 });
        setIsBlocked(false);
        setAttemptsRemaining(maxAttempts);
    };

    const resetRateLimit = () => {
        localStorage.removeItem(STORAGE_KEY);
        setIsBlocked(false);
        setRemainingTime(0);
        setAttemptsRemaining(maxAttempts);
    };

    useEffect(() => {
        checkRateLimit();

        // Verificar periodicamente se o bloqueio expirou
        const interval = setInterval(() => {
            if (isBlocked && remainingTime > 0) {
                const newTime = remainingTime - 1;
                setRemainingTime(newTime);

                if (newTime <= 0) {
                    checkRateLimit();
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isBlocked, remainingTime]);

    const formatRemainingTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;
    };

    return {
        isBlocked,
        remainingTime,
        attemptsRemaining,
        recordFailedAttempt,
        recordSuccessfulAttempt,
        resetRateLimit,
        canAttempt: !isBlocked,
        formatRemainingTime: () => formatRemainingTime(remainingTime)
    };
}; 