import { differenceInDays, parseISO, isValid } from 'date-fns';
import { Candidate } from '@/hooks/useCandidates';
import { HistoryItem } from '@/hooks/useCandidateNotes';

export interface StageTimeInfo {
    stage: string;
    days: number;
    startDate: string | null;
    endDate: string | null;
}

/**
 * Calcula o tempo que o candidato passou em cada etapa do processo seletivo
 * @param candidate - Candidato com status_entered_at e created_at
 * @param history - Histórico de notas com mudanças de status
 * @returns Array com informações de tempo em cada etapa
 */
export function calculateStageTimes(
    candidate: Candidate,
    history: HistoryItem[] = []
): StageTimeInfo[] {
    const stages: StageTimeInfo[] = [];
    
    // Filtrar apenas notas de mudança de status, ordenadas por data (mais antiga primeiro)
    const statusChanges = history
        .filter(item => item.activity_type === 'Mudança de Status')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    // Data de criação do candidato (início do processo)
    const processStart = candidate.created_at ? parseISO(candidate.created_at) : new Date();
    
    // Status atual do candidato
    const currentStatus = candidate.status;
    const currentStatusEnteredAt = candidate.status_entered_at 
        ? parseISO(candidate.status_entered_at) 
        : null;
    
    // Se não há mudanças de status registradas, o candidato está na etapa inicial
    if (statusChanges.length === 0) {
        const daysInCurrentStage = currentStatusEnteredAt 
            ? differenceInDays(new Date(), currentStatusEnteredAt)
            : differenceInDays(new Date(), processStart);
        
        stages.push({
            stage: currentStatus || 'Cadastrado',
            days: Math.max(0, daysInCurrentStage),
            startDate: candidate.created_at,
            endDate: null // Ainda nesta etapa
        });
        
        return stages;
    }
    
    // Processar cada mudança de status
    let previousDate = processStart;
    let previousStatus = 'Cadastrado'; // Status inicial
    
    for (let i = 0; i < statusChanges.length; i++) {
        const change = statusChanges[i];
        const changeDate = parseISO(change.created_at);
        
        // Extrair o status da nota - tentar diferentes formatos
        let newStatus = 'Desconhecido';
        const patterns = [
            /Status alterado para ["']?([^"']+)["']?/i,
            /alterado para ["']?([^"']+)["']?/i,
            /para ["']?([^"']+)["']?/i
        ];
        
        for (const pattern of patterns) {
            const match = change.content.match(pattern);
            if (match && match[1]) {
                newStatus = match[1].trim();
                break;
            }
        }
        
        // Se não encontrou, usar o status atual como fallback
        if (newStatus === 'Desconhecido' && i === statusChanges.length - 1) {
            newStatus = currentStatus || 'Desconhecido';
        }
        
        // Calcular dias na etapa anterior
        const daysInPreviousStage = differenceInDays(changeDate, previousDate);
        
        if (daysInPreviousStage >= 0 && previousStatus !== 'Desconhecido') {
            stages.push({
                stage: previousStatus,
                days: daysInPreviousStage,
                startDate: previousDate.toISOString(),
                endDate: change.created_at
            });
        }
        
        previousDate = changeDate;
        previousStatus = newStatus;
    }
    
    // Adicionar a etapa atual
    const currentStageStart = currentStatusEnteredAt || (statusChanges.length > 0 ? parseISO(statusChanges[statusChanges.length - 1].created_at) : processStart);
    const daysInCurrentStage = differenceInDays(new Date(), currentStageStart);
    
    stages.push({
        stage: currentStatus || previousStatus,
        days: Math.max(0, daysInCurrentStage),
        startDate: currentStatusEnteredAt?.toISOString() || (statusChanges.length > 0 ? statusChanges[statusChanges.length - 1].created_at : candidate.created_at),
        endDate: null // Ainda nesta etapa
    });
    
    return stages;
}

/**
 * Calcula o tempo total do processo seletivo
 */
export function calculateTotalProcessTime(candidate: Candidate): number {
    if (!candidate.created_at) return 0;
    
    const startDate = parseISO(candidate.created_at);
    return differenceInDays(new Date(), startDate);
}

/**
 * Formata o tempo em cada etapa para exibição
 */
export function formatStageTimesSummary(stages: StageTimeInfo[]): string {
    if (stages.length === 0) return 'Nenhuma etapa registrada';
    
    const totalDays = stages.reduce((sum, stage) => sum + stage.days, 0);
    const stagesList = stages.map(s => `${s.stage}: ${s.days} dia(s)`).join(' | ');
    
    return `Total: ${totalDays} dias | ${stagesList}`;
}

