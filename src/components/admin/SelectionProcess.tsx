import { useState, useMemo, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
import { useAllJobs, Job, useUpdateJobFlowStatus, useUpdateJob } from '@/hooks/useJobs';
import { useCandidates, Candidate, useUpdateCandidateStatus } from '@/hooks/useCandidates';
import { useCandidatesByJob } from '@/hooks/useCandidatesByJob';
import { SELECTION_STATUSES, SelectionStatus, STATUS_COLORS } from '@/lib/constants';
import { Loader2, PlusCircle, Linkedin, Gavel, Grid3X3, ArrowRightLeft, RefreshCw, Search, ChevronDown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import CandidateDetailModal from './CandidateDetailModal';
import { useCreateCandidateNote } from '@/hooks/useCandidateNotes';
import { useAuth } from '@/hooks/useAuth';
import { useRHProfile } from '@/hooks/useRH';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useAllRejectionNotes } from '@/hooks/useAllRejectionNotes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQueryClient } from '@tanstack/react-query';
import { differenceInDays, parseISO, isValid } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { JobStatusUpdateModal } from './JobStatusUpdateModal';

// Helper para obter iniciais do nome
const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    const firstInitial = names[0]?.[0] || '';
    const lastInitial = names.length > 1 ? names[names.length - 1]?.[0] : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
};

// Helper mais robusto para calcular os dias na etapa atual
// Agora usa status_entered_at para calcular apenas o tempo na etapa atual
const getDaysInStage = (dateString: string | null): number => {
    if (!dateString) return 0;
    const date = parseISO(dateString);
    if (!isValid(date)) {
        console.warn(`Data inválida encontrada para o candidato: ${dateString}`);
        return 0;
    }
    return differenceInDays(new Date(), date);
}

const KanbanCard = ({ candidate, index, onClick }) => {
    // CORREÇÃO: Usar status_entered_at em vez de created_at para contar apenas o tempo na etapa atual
    // Se status_entered_at não existir, usar created_at como fallback (para candidatos antigos)
    const daysInStage = getDaysInStage(candidate.status_entered_at || candidate.created_at);
    const borderColor = STATUS_COLORS[candidate.status as SelectionStatus]?.replace('bg-', 'border-').split(' ')[0] || 'border-gray-300';

    const legalStatusIconMap = {
        pendente: <Gavel className="h-4 w-4 text-gray-400" title="Aguardando Validação" />,
        aprovado: <Gavel className="h-4 w-4 text-green-500" title="Aprovado pelo Jurídico" />,
        aprovado_com_restricao: <Gavel className="h-4 w-4 text-yellow-500" title={`Aprovado com Restrição: ${candidate.legal_validation_comment || ''}`} />,
        reprovado: <Gavel className="h-4 w-4 text-red-500" title={`Reprovado pelo Jurídico: ${candidate.legal_validation_comment || ''}`} />,
    };

    return (
        <Draggable draggableId={candidate.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onClick(candidate)}
                    className={`bg-white p-3 rounded-lg shadow-sm cursor-pointer border-l-4 hover:shadow-lg transition-shadow duration-200 ${borderColor} ${snapshot.isDragging ? 'ring-2 ring-cgb-accent' : ''}`}
                >
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={candidate.avatar_url || ''} />
                            <AvatarFallback className="bg-cgb-primary text-white font-bold text-xs">{getInitials(candidate.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1">
                                {candidate.status === 'Validação TJ' && legalStatusIconMap[candidate.legal_status]}
                                <p className="font-semibold text-gray-800 text-sm truncate">{candidate.name}</p>
                            </div>
                            <span className="text-xs text-gray-500">{daysInStage} dias nesta fase</span>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

const SelectionProcess = () => {
    const queryClient = useQueryClient(); // BUG FIX: Para invalidar queries após atualizações diretas
    const { data: allJobs = [], isLoading: isLoadingJobs } = useAllJobs();
    // BUG FIX: Removido useCandidates() global que buscava TODOS os candidatos
    // Agora usamos useCandidatesByJob() que busca apenas os candidatos da vaga selecionada
    // const { data: candidates = [], isLoading: isLoadingCandidates } = useCandidates();
    const updateStatus = useUpdateCandidateStatus();
    const updateJobFlowStatus = useUpdateJobFlowStatus();
    const updateJob = useUpdateJob();
    const createNote = useCreateCandidateNote();
    const { user } = useAuth();
    const { data: rhProfile, isLoading: isRhProfileLoading } = useRHProfile(user?.id);
    const { toast } = useToast();
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

    // BUG FIX: Hook otimizado que busca apenas candidatos da vaga selecionada (server-side)
    const { data: jobCandidates = [], isLoading: isLoadingCandidates, error: candidatesError } = useCandidatesByJob(selectedJobId);

    // Debug: Log para monitorar mudanças
    useEffect(() => {
        console.log(`🔍 [SelectionProcess] Vaga selecionada: ${selectedJobId}`);
        console.log(`📊 [SelectionProcess] Candidatos carregados: ${jobCandidates.length}`);
        if (candidatesError) {
            console.error(`❌ [SelectionProcess] Erro ao carregar candidatos:`, candidatesError);
        }
    }, [selectedJobId, jobCandidates.length, candidatesError]);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [shouldAutoOpenLegalForm, setShouldAutoOpenLegalForm] = useState(false);
    const [candidateToReject, setCandidateToReject] = useState<Candidate | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedRejectionMotif, setSelectedRejectionMotif] = useState("");
    const { data: rejectionNotes = [] } = useAllRejectionNotes();

    // Opções de motivos de reprovação
    const rejectionMotifs = [
        "Não possui moto",
        "Não possui CNH",
        "Reprovado pelo RH",
        "Não possui moto e CNH",
        "Moto fora do ano de corte",
        "Reprovado pelo gestor",
        "Modelo de moto inadequado",
        "CNH provisória",
        "Desistiu da vaga",
        "Sem documentação",
        "Reprovado na pesquisa",
        "Não é Pessoa com Deficiência",
        "Não compareceu",
        "Não aceitou a proposta"
    ];
    const [activeTab, setActiveTab] = useState("ativos");
    const [layoutMode, setLayoutMode] = useState<'grid' | 'horizontal'>('grid');
    const [showJobStatusModal, setShowJobStatusModal] = useState(false);
    const [pendingApproval, setPendingApproval] = useState<{ candidate: Candidate; job: Job } | null>(null);
    const [isJobSelectOpen, setIsJobSelectOpen] = useState(false);

    const jobsForSelection = useMemo(() => {
        if (isRhProfileLoading) {
            console.log(`⏳ [SelectionProcess] Carregando perfil RH...`);
            return [];
        }

        // Filtrar apenas vagas ativas (flow_status = 'ativa')
        let activeJobs = allJobs.filter(job => job.flow_status === 'ativa' || !job.flow_status);
        console.log(`📊 [SelectionProcess] Vagas ativas (antes de filtros): ${activeJobs.length}`);
        
        // NOTA: O filtro de busca agora é feito pelo Command component internamente

        // BUG FIX: Filtro de região e departamento para RECRUTADOR, GERENTE e SOLICITADOR
        if (rhProfile && 'role' in rhProfile) {
            const assignedStates = (rhProfile.assigned_states as string[]) || [];
            const assignedCities = (rhProfile.assigned_cities as string[]) || [];
            const assignedDepartments = (rhProfile.assigned_departments as string[]) || [];

            console.log(`🔍 [SelectionProcess] Perfil: ${rhProfile.role}`, {
                states: assignedStates,
                cities: assignedCities,
                departments: assignedDepartments
            });

            // Aplicar filtros apenas se houver permissões específicas atribuídas
            const hasStateFilter = assignedStates.length > 0;
            const hasCityFilter = assignedCities.length > 0;
            // CORREÇÃO: Aplicar filtro de departamento também para SOLICITADOR
            const hasDepartmentFilter = (rhProfile.role === 'manager' || rhProfile.role === 'solicitador') && assignedDepartments.length > 0;

            if (hasStateFilter || hasCityFilter || hasDepartmentFilter) {
                const beforeFilter = activeJobs.length;
                
                // Helper para normalizar strings (remover acentos, converter para minúsculas, trim)
                const normalizeString = (str: string | null | undefined): string => {
                    if (!str) return '';
                    return str
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
                        .trim();
                };
                
                // Normalizar arrays de permissões uma vez
                const normalizedStates = assignedStates.map(s => normalizeString(s));
                const normalizedCities = assignedCities.map(c => normalizeString(c));
                const normalizedDepartments = assignedDepartments.map(d => normalizeString(d));
                
                activeJobs = activeJobs.filter(job => {
                    // Normalizar valores da vaga
                    const jobState = normalizeString(job.state);
                    const jobCity = normalizeString(job.city);
                    const jobDepartment = normalizeString(job.department);
                    
                    // Filtro por estado (se atribuído) - comparação case-insensitive e sem acentos
                    const matchState = !hasStateFilter || normalizedStates.includes(jobState);
                    
                    // Filtro por cidade (se atribuído) - comparação case-insensitive e sem acentos
                    const matchCity = !hasCityFilter || normalizedCities.includes(jobCity);
                    
                    // Filtro por departamento (apenas para gerentes, se atribuído)
                    // A vaga deve estar em QUALQUER um dos departamentos atribuídos (OR)
                    const matchDepartment = !hasDepartmentFilter || (jobDepartment && normalizedDepartments.includes(jobDepartment));

                    // Aplicar lógica: se tem estado E cidade, ambos devem bater
                    // Se tem apenas estado OU apenas cidade, pelo menos um deve bater
                    let regionMatch = true;
                    if (hasStateFilter && hasCityFilter) {
                        // Tem estado E cidade: ambos devem bater
                        regionMatch = matchState && matchCity;
                    } else if (hasStateFilter) {
                        // Tem apenas estado
                        regionMatch = matchState;
                    } else if (hasCityFilter) {
                        // Tem apenas cidade
                        regionMatch = matchCity;
                    }

                    // Resultado final: região E departamento (se aplicável)
                    const result = regionMatch && matchDepartment;
                    
                    if (!result) {
                        console.log(`❌ [SelectionProcess] Vaga "${job.title}" filtrada:`, {
                            jobState: job.state,
                            jobCity: job.city,
                            jobDepartment: job.department,
                            normalizedJobState: jobState,
                            normalizedJobCity: jobCity,
                            normalizedJobDepartment: jobDepartment,
                            assignedStates: assignedStates,
                            assignedCities: assignedCities,
                            assignedDepartments: assignedDepartments,
                            normalizedStates,
                            normalizedCities,
                            normalizedDepartments,
                            matchState,
                            matchCity,
                            matchDepartment,
                            regionMatch
                        });
                    }
                    
                    return result;
                });
                console.log(`🔍 [SelectionProcess] Vagas após filtros: ${activeJobs.length} (de ${beforeFilter})`);
            } else {
                console.log(`ℹ️ [SelectionProcess] Sem filtros de permissão aplicados`);
            }
        } else {
            console.log(`ℹ️ [SelectionProcess] Sem perfil RH ou perfil não tem role`);
        }

        console.log(`✅ [SelectionProcess] Vagas disponíveis para seleção: ${activeJobs.length}`);
        if (activeJobs.length > 0) {
            console.log(`📋 [SelectionProcess] Primeiras 3 vagas:`, activeJobs.slice(0, 3).map(j => `${j.title} - ${j.city}, ${j.state}`));
        }

        return activeJobs;
    }, [allJobs, rhProfile, isRhProfileLoading]);

    useEffect(() => {
        console.log(`🔍 [SelectionProcess] useEffect - selectedJobId: ${selectedJobId}, jobsForSelection.length: ${jobsForSelection.length}`);
        if (!selectedJobId && jobsForSelection.length > 0) {
            const firstJobId = jobsForSelection[0].id;
            console.log(`✅ [SelectionProcess] Selecionando automaticamente primeira vaga: ${firstJobId} (${jobsForSelection[0].title})`);
            setSelectedJobId(firstJobId);
        } else if (!selectedJobId && jobsForSelection.length === 0 && !isRhProfileLoading) {
            console.warn(`⚠️ [SelectionProcess] Nenhuma vaga disponível para seleção`);
        }
    }, [selectedJobId, jobsForSelection, isRhProfileLoading]);

    /*
    // Este useEffect foi removido pois estava causando um efeito colateral indesejado.
    // Ele resetava o `legal_status` para 'pendente' sempre que um candidato em 'Validação TJ'
    // era aprovado pelo jurídico, desfazendo a ação visualmente no Kanban.
    // A lógica atual de aprovação já garante a consistência dos status.
    useEffect(() => {
        const checkAndFixLegalStatus = async () => {
            if (!candidates.length) return;

            const candidatesInTJWithWrongStatus = candidates.filter(
                c => c.status === 'Validação TJ' && c.legal_status !== 'pendente'
            );

            if (candidatesInTJWithWrongStatus.length > 0) {
                console.log(`Corrigindo legal_status para ${candidatesInTJWithWrongStatus.length} candidatos em Validação TJ`);

                for (const candidate of candidatesInTJWithWrongStatus) {
                    try {
                        const { error } = await supabase
                            .from('candidates')
                            .update({ legal_status: 'pendente' })
                            .eq('id', candidate.id);

                        if (error) {
                            console.error(`Erro ao corrigir legal_status para ${candidate.name}:`, error);
                        } else {
                            console.log(`Legal_status corrigido para ${candidate.name}`);

                            // BUG FIX: Invalidar queries para atualização automática da UI
                            queryClient.invalidateQueries({ queryKey: ['candidates'] });
                            queryClient.invalidateQueries({ queryKey: ['candidatesByJob'] });
                            queryClient.invalidateQueries({ queryKey: ['dashboardData'] });

                            if (user) {
                                createNote.mutate({
                                    candidate_id: candidate.id,
                                    author_id: user.id,
                                    note: `Sistema detectou candidato em "Validação TJ" com status jurídico inconsistente. Status legal resetado para "pendente" - nova validação necessária.`,
                                    activity_type: 'Correção Automática'
                                });
                            }
                        }
                    } catch (error) {
                        console.error(`Erro ao corrigir legal_status para ${candidate.name}:`, error);
                    }
                }
            }
        };

        checkAndFixLegalStatus();
    }, [candidates]);
    */

    const handleCardClick = (candidate: Candidate) => {
        setSelectedCandidate(candidate);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCandidate(null);
        setShouldAutoOpenLegalForm(false); // Resetar flag ao fechar modal
    };

    // BUG FIX: Não precisa mais filtrar localmente, pois jobCandidates já vem filtrado do servidor
    const filteredCandidates = useMemo(() => {
        if (!selectedJobId || !Array.isArray(jobCandidates)) return [];
        // jobCandidates já está filtrado por job_id no hook useCandidatesByJob
        console.log(`🔍 [SelectionProcess] filteredCandidates: ${jobCandidates.length} candidatos`, jobCandidates.map(c => ({ id: c.id, name: c.name, status: c.status })));
        return jobCandidates;
    }, [selectedJobId, jobCandidates]);

    const columns = useMemo(() => {
        // Gera as colunas dinamicamente a partir das constantes
        const initialCols = SELECTION_STATUSES.reduce((acc, status) => {
            acc[status] = [];
            return acc;
        }, {} as Record<SelectionStatus, Candidate[]>);

        console.log(`🔍 [SelectionProcess] Processando ${filteredCandidates.length} candidatos para aba "${activeTab}"`);

        // Filtra candidatos por aba e distribui nas colunas
        filteredCandidates.forEach(candidate => {
            const candidateStatus = candidate.status || null;
            const status = (candidateStatus && SELECTION_STATUSES.includes(candidateStatus as any))
                ? candidateStatus as SelectionStatus
                : "Cadastrado";

            console.log(`🔍 [SelectionProcess] Candidato ${candidate.name}: status original="${candidateStatus}", status mapeado="${status}"`);

            // Lógica de filtro por aba
            if (activeTab === "ativos") {
                // Na aba ativos, mostra todos exceto contratados (mantém reprovados e aprovados em suas colunas)
                if (status !== 'Contratado') {
                    if (initialCols[status]) {
                        initialCols[status].push(candidate);
                        console.log(`✅ [SelectionProcess] Adicionado candidato ${candidate.name} à coluna "${status}"`);
                    } else {
                        console.warn(`⚠️ [SelectionProcess] Coluna "${status}" não existe em initialCols`);
                    }
                } else {
                    console.log(`⏭️ [SelectionProcess] Candidato ${candidate.name} ignorado (status: Contratado na aba ativos)`);
                }
            } else if (activeTab === "reprovados") {
                // Na aba reprovados, mostra apenas reprovados
                if (status === 'Reprovado') {
                    if (initialCols[status]) {
                        initialCols[status].push(candidate);
                        console.log(`✅ [SelectionProcess] Adicionado candidato ${candidate.name} à coluna "${status}"`);
                    }
                } else {
                    console.log(`⏭️ [SelectionProcess] Candidato ${candidate.name} ignorado (status: ${status} na aba reprovados)`);
                }
            } else if (activeTab === "aprovados") {
                // Na aba aprovados, mostra apenas aprovados
                if (status === 'Aprovado') {
                    if (initialCols[status]) {
                        initialCols[status].push(candidate);
                        console.log(`✅ [SelectionProcess] Adicionado candidato ${candidate.name} à coluna "${status}"`);
                    }
                } else {
                    console.log(`⏭️ [SelectionProcess] Candidato ${candidate.name} ignorado (status: ${status} na aba aprovados)`);
                }
            }
        });

        // Log final das colunas
        Object.keys(initialCols).forEach(key => {
            const count = initialCols[key as SelectionStatus]?.length || 0;
            if (count > 0) {
                console.log(`📊 [SelectionProcess] Coluna "${key}": ${count} candidato(s)`);
            }
        });

        // Remove colunas vazias apenas nas abas específicas
        if (activeTab === 'reprovados') {
            // Na aba reprovados, remove todas as colunas exceto "Reprovado"
            Object.keys(initialCols).forEach(key => {
                if (key !== 'Reprovado') {
                    delete initialCols[key as SelectionStatus];
                }
            });
        } else if (activeTab === 'aprovados') {
            // Na aba aprovados, remove todas as colunas exceto "Aprovado"
            Object.keys(initialCols).forEach(key => {
                if (key !== 'Aprovado') {
                    delete initialCols[key as SelectionStatus];
                }
            });
        } else if (activeTab === 'ativos') {
            // Na aba ativos, remove a coluna "Contratado" (mantém "Reprovado" e "Aprovado")
            delete initialCols['Contratado'];
        }
        // Na aba "ativos", mantém todas as colunas exceto "Contratado"

        return initialCols;
    }, [filteredCandidates, activeTab]);

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;

        // BUG FIX: Usar jobCandidates ao invés de candidates global
        const candidate = jobCandidates.find(c => c.id === draggableId);
        if (!candidate) return;

        // Regra de bloqueio para Validação TJ
        if (source.droppableId === 'Validação TJ' && destination.droppableId !== 'Validação TJ') {
            const { data: legalData, error } = await supabase
                .from('candidate_legal_data')
                .select('review_status')
                .eq('candidate_id', candidate.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error || !legalData || legalData.review_status !== 'approved') {
                toast({
                    title: 'Ação Bloqueada',
                    description: 'Este candidato ainda não foi validado pelo departamento jurídico.',
                    variant: 'destructive',
                });
                return;
            }
        }

        const newStatus = destination.droppableId as SelectionStatus;

        // Validar se o newStatus é uma das etapas válidas
        if (!SELECTION_STATUSES.includes(newStatus)) {
            toast({
                title: "Movimento Inválido",
                description: `A etapa "${newStatus}" não é um destino válido.`,
                variant: "destructive",
            });
            return;
        }

        if (newStatus === 'Reprovado') {
            setCandidateToReject(candidate);
        } else if (newStatus === 'Aprovado') {
            // Quando mover para Aprovado, mostrar modal para atualizar status da vaga
            const job = allJobs.find(j => j.id === candidate.job_id);
            if (job) {
                setPendingApproval({ candidate, job });
                setShowJobStatusModal(true);
            } else {
                // CORREÇÃO: Se não encontrar a vaga, buscar do banco e atualizar quantity também
                console.warn('⚠️ [SelectionProcess] Vaga não encontrada no estado, buscando do banco...');
                const { data: jobFromDb, error: jobError } = await supabase
                    .from('jobs')
                    .select('id, quantity, flow_status, title')
                    .eq('id', candidate.job_id)
                    .single();
                
                if (jobFromDb && !jobError) {
                    // Buscar vaga atualizada antes de calcular
                    const { data: updatedJob } = await supabase
                        .from('jobs')
                        .select('quantity')
                        .eq('id', candidate.job_id)
                        .single();
                    
                    const currentQuantity = updatedJob?.quantity || jobFromDb.quantity || 0;
                    const newQuantity = Math.max(0, currentQuantity - 1);
                    
                    const updateData: any = { quantity: newQuantity };
                    if (newQuantity === 0) {
                        updateData.flow_status = 'concluida';
                    }
                    
                    await updateJob.mutateAsync({
                        id: candidate.job_id,
                        ...updateData
                    });
                    
                    updateStatus.mutate({ id: draggableId, status: newStatus }, {
                        onSuccess: () => {
                            toast({ 
                                title: "Candidato Aprovado!", 
                                description: `${candidate.name} foi aprovado. ${newQuantity === 0 ? 'Todas as vagas foram preenchidas - vaga marcada como concluída.' : `Restam ${newQuantity} vaga(s).`}` 
                            });
                            if (user) createNote.mutate({
                                candidate_id: draggableId,
                                author_id: user.id,
                                note: `Candidato aprovado. ${newQuantity === 0 ? 'Todas as vagas foram preenchidas - vaga marcada como concluída automaticamente.' : `Restam ${newQuantity} vaga(s).`}`,
                                activity_type: 'Aprovação'
                            });
                        },
                        onError: (error) => toast({ title: "Erro ao atualizar", description: `Não foi possível mover o candidato. ${error.message}`, variant: "destructive" })
                    });
                } else {
                    // Se não encontrar a vaga nem no banco, apenas atualiza o status
                    updateStatus.mutate({ id: draggableId, status: newStatus }, {
                        onSuccess: () => {
                            toast({ title: "Status atualizado!", description: `O candidato foi movido para ${newStatus}.` });
                            if (user) createNote.mutate({
                                candidate_id: draggableId,
                                author_id: user.id,
                                note: `Status alterado para "${newStatus}"`,
                                activity_type: 'Mudança de Status'
                            });
                        },
                        onError: (error) => toast({ title: "Erro ao atualizar", description: `Não foi possível mover o candidato. ${error.message}`, variant: "destructive" })
                    });
                }
            }
        } else {
            // Verificar se o candidato está sendo movido PARA "Validação TJ"
            const shouldResetLegalStatus = newStatus === 'Validação TJ';
            // Verificar se está vindo de uma etapa posterior (ou seja, voltando)
            const isMovingBackward = shouldResetLegalStatus && source.droppableId !== 'Validação TJ';

            updateStatus.mutate({ id: draggableId, status: newStatus }, {
                onSuccess: async (updatedCandidate) => {
                    console.log('✅ [SelectionProcess] Status atualizado com sucesso:', {
                        candidateId: draggableId,
                        newStatus,
                        oldStatus: source.droppableId
                    });

                    // Se movido para Validação TJ, mostrar alerta e abrir modal
                    if (shouldResetLegalStatus) {
                        // 🔥 Alerta especial para Validação TJ - SEMPRE mostrar
                        console.log('🔥 [SelectionProcess] Mostrando alerta para Validação TJ');
                        toast({
                            title: "⚠️ ATENÇÃO: Preencha o Contrato da Empresa",
                            description: "O campo 'Contrato da Empresa' é ESSENCIAL para a avaliação do departamento jurídico. Por favor, preencha este campo nos dados jurídicos do candidato.",
                            variant: "destructive",
                            duration: 8000
                        });

                        // 🔥 NOVA FUNCIONALIDADE: Abrir modal automaticamente para preencher dados jurídicos
                        // Usar o candidato ATUALIZADO com o novo status
                        const updatedCandidateWithStatus = {
                            ...candidate,
                            status: newStatus
                        };

                        console.log('🔥 [SelectionProcess] Abrindo modal para candidato:', updatedCandidateWithStatus.name, 'com status:', newStatus);
                        // Aguardar um breve momento para que o toast apareça e as queries sejam atualizadas
                        setTimeout(() => {
                            setSelectedCandidate(updatedCandidateWithStatus);
                            setShouldAutoOpenLegalForm(true); // 🔥 FLAG para abrir formulário legal automaticamente
                            setIsModalOpen(true);
                            console.log('🔥 [SelectionProcess] Modal aberto para:', updatedCandidateWithStatus.name);
                        }, 500);

                        // Resetar status legal se necessário
                        try {
                            const { error } = await supabase
                                .from('candidates')
                                .update({ legal_status: 'pendente' })
                                .eq('id', draggableId);

                            if (error) {
                                console.error('Erro ao resetar legal_status:', error);
                            } else {
                                // BUG FIX: Invalidar queries para atualização automática da UI
                                await Promise.all([
                                    queryClient.invalidateQueries({ queryKey: ['candidates'] }),
                                    queryClient.invalidateQueries({ queryKey: ['candidatesByJob'] }),
                                    queryClient.invalidateQueries({ queryKey: ['dashboardData'] }),
                                    queryClient.invalidateQueries({ queryKey: ['candidatesStatsByJob'] }),
                                    queryClient.invalidateQueries({ queryKey: ['candidatesCountByJob'] }),
                                    queryClient.invalidateQueries({ queryKey: ['candidatesCounts'] }),
                                ]);

                                if (isMovingBackward) {
                                    console.log('🔥 [SelectionProcess] Candidato retornou para Validação TJ');
                                }
                            }
                        } catch (error) {
                            console.error('Erro ao resetar legal_status:', error);
                        }
                    } else {
                        toast({ title: "Status atualizado!", description: `O candidato foi movido para ${newStatus}.` });
                    }

                    if (user) createNote.mutate({
                        candidate_id: draggableId,
                        author_id: user.id,
                        note: shouldResetLegalStatus
                            ? `Status alterado para "${newStatus}" - Validação jurídica ${isMovingBackward ? 'resetada para nova análise' : 'necessária'}`
                            : `Status alterado para "${newStatus}"`,
                        activity_type: 'Mudança de Status'
                    });
                },
                onError: (error) => toast({ title: "Erro ao atualizar", description: `Não foi possível mover o candidato. ${error.message}`, variant: "destructive" })
            });
        }
    };

    const handleConfirmRejection = async () => {
        if (!candidateToReject || (!selectedRejectionMotif && !rejectionReason.trim())) {
            toast({ title: "Campo obrigatório", description: "Por favor, selecione um motivo ou preencha uma observação.", variant: "destructive" });
            return;
        }
        const { id: candidateId } = candidateToReject;

        // Combinar motivo selecionado com observação adicional
        const fullRejectionNote = selectedRejectionMotif
            ? (rejectionReason.trim() ? `${selectedRejectionMotif} - ${rejectionReason}` : selectedRejectionMotif)
            : rejectionReason;

        try {
            await updateStatus.mutateAsync({ id: candidateId, status: 'Reprovado' });
            if (user) await createNote.mutateAsync({ candidate_id: candidateId, author_id: user.id, note: `Motivo da reprovação: ${fullRejectionNote}`, activity_type: 'Reprovação' });
            toast({ title: "Candidato reprovado", description: "O status e a nota foram salvos com sucesso." });
        } catch (error: any) {
            toast({ title: "Erro", description: `Não foi possível completar a ação: ${error.message}`, variant: "destructive" });
        } finally {
            setCandidateToReject(null);
            setRejectionReason("");
            setSelectedRejectionMotif("");
        }
    };

    const handleConfirmJobStatus = async (flowStatus: 'ativa' | 'concluida' | 'congelada') => {
        if (!pendingApproval) return;

        const { candidate, job } = pendingApproval;

        try {
            // 1. Atualizar status do candidato para Aprovado
            await updateStatus.mutateAsync({ id: candidate.id, status: 'Aprovado' });

            // 2. CORREÇÃO CRÍTICA: Buscar vaga atualizada do banco para ter quantity correto
            // Isso evita problemas quando múltiplos candidatos são aprovados rapidamente
            const { data: updatedJob, error: jobError } = await supabase
                .from('jobs')
                .select('quantity, flow_status')
                .eq('id', job.id)
                .single();

            if (jobError) {
                console.error('❌ [SelectionProcess] Erro ao buscar vaga atualizada:', jobError);
                throw jobError;
            }

            // 3. NOVA FUNCIONALIDADE: Diminuir quantidade de vagas automaticamente
            // Usar quantity atualizado do banco, não do estado
            const currentQuantity = updatedJob?.quantity || job.quantity || 0;
            const newQuantity = Math.max(0, currentQuantity - 1); // Não pode ser negativo

            console.log('📊 [SelectionProcess] Atualizando quantidade de vagas:', {
                jobId: job.id,
                jobTitle: job.title,
                currentQuantity,
                newQuantity,
                candidateName: candidate.name,
                quantityDoBanco: updatedJob?.quantity,
                quantityDoEstado: job.quantity
            });

            // Preparar dados para atualização
            const updateData: any = { quantity: newQuantity };

            // Se quantity chegou a 0, marcar vaga como concluída automaticamente
            if (newQuantity === 0) {
                updateData.flow_status = 'concluida';
                console.log('✅ [SelectionProcess] Todas as vagas foram preenchidas! Marcando vaga como concluída automaticamente.');
            } else {
                // Caso contrário, usar o flowStatus escolhido pelo usuário
                updateData.flow_status = flowStatus;
            }

            // Atualizar quantity e flow_status da vaga
            await updateJob.mutateAsync({
                id: job.id,
                ...updateData
            });

            // 4. Criar nota sobre a aprovação
            if (user) {
                const finalFlowStatus = newQuantity === 0 ? 'concluida' : flowStatus;
                await createNote.mutateAsync({
                    candidate_id: candidate.id,
                    author_id: user.id,
                    note: `Candidato aprovado. ${newQuantity === 0 ? 'Todas as vagas foram preenchidas - vaga marcada como concluída automaticamente.' : `Status da vaga atualizado para: ${finalFlowStatus === 'ativa' ? 'Ativa' : finalFlowStatus === 'concluida' ? 'Concluída' : 'Congelada'}. Restam ${newQuantity} vaga(s).`}`,
                    activity_type: 'Aprovação'
                });
            }

            const statusLabels = {
                'ativa': 'Ativa',
                'concluida': 'Concluída',
                'congelada': 'Congelada'
            };

            const finalFlowStatus = newQuantity === 0 ? 'concluida' : flowStatus;
            const finalStatusLabel = statusLabels[finalFlowStatus];

            toast({
                title: "Candidato Aprovado!",
                description: `${candidate.name} foi aprovado. ${newQuantity === 0 ? 'Todas as vagas foram preenchidas - vaga marcada como concluída automaticamente.' : `A vaga foi marcada como ${finalStatusLabel}.`} ${newQuantity > 0 ? `Restam ${newQuantity} vaga(s).` : ''}`,
            });
        } catch (error: any) {
            toast({
                title: "Erro ao aprovar",
                description: `Não foi possível concluir a ação: ${error.message}`,
                variant: "destructive"
            });
        } finally {
            setShowJobStatusModal(false);
            setPendingApproval(null);
        }
    };

    if (isLoadingJobs || isLoadingCandidates || isRhProfileLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-cgb-primary" /></div>;
    }

    const selectedJob = allJobs.find(job => job.id === selectedJobId);

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <Popover open={isJobSelectOpen} onOpenChange={setIsJobSelectOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full md:w-96 text-lg font-semibold justify-between"
                                >
                                    {selectedJobId
                                        ? (() => {
                                            const selectedJob = jobsForSelection.find((job) => job.id === selectedJobId);
                                            return selectedJob 
                                                ? `${selectedJob.title} - ${selectedJob.city}, ${selectedJob.state}`
                                                : "Selecione a vaga...";
                                        })()
                                        : "Selecione a vaga..."}
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full md:w-96 p-0" align="start">
                                <Command>
                                    <CommandInput 
                                        placeholder="Buscar vaga por título, cidade ou departamento..." 
                                    />
                                    <CommandList>
                                        <CommandEmpty>Nenhuma vaga encontrada.</CommandEmpty>
                                        <CommandGroup>
                                            {jobsForSelection.map((job) => (
                                                <CommandItem
                                                    key={job.id}
                                                    value={`${job.title} ${job.city} ${job.state} ${job.department || ''}`}
                                                    onSelect={() => {
                                                        setSelectedJobId(job.id);
                                                        setIsJobSelectOpen(false); // Fechar popover após seleção
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedJobId === job.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {job.title} - {job.city}, {job.state}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                // Forçar refresh dos dados
                                queryClient.invalidateQueries({ queryKey: ['candidatesByJob'] });
                                toast({ title: "Dados atualizados!", description: "Lista de candidatos foi atualizada." });
                            }}
                            className="flex items-center gap-2"
                            disabled={isLoadingCandidates}
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoadingCandidates ? 'animate-spin' : ''}`} />
                            Atualizar
                        </Button>
                        <Button
                            variant={layoutMode === 'grid' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setLayoutMode('grid')}
                            className="flex items-center gap-2"
                        >
                            <Grid3X3 className="w-4 h-4" />
                            Blocos
                        </Button>
                        <Button
                            variant={layoutMode === 'horizontal' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setLayoutMode('horizontal')}
                            className="flex items-center gap-2"
                        >
                            <ArrowRightLeft className="w-4 h-4" />
                            Horizontal
                        </Button>
                    </div>
                </div>

            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="ativos">Ativos</TabsTrigger>
                    <TabsTrigger value="reprovados">Reprovados</TabsTrigger>
                    <TabsTrigger value="aprovados">Aprovados</TabsTrigger>
                </TabsList>
            </Tabs>

            {selectedJobId ? (
                <>
                    {/* Indicador de erro */}
                    {candidatesError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-red-700">
                                <strong>⚠️ Erro ao carregar candidatos:</strong> {candidatesError.message || 'Erro desconhecido'}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => queryClient.invalidateQueries({ queryKey: ['candidatesByJob'] })}
                                className="mt-2"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Tentar Novamente
                            </Button>
                        </div>
                    )}

                    {activeTab === 'reprovados' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-blue-700">
                                <strong>📊 Estatística:</strong> Total de candidatos reprovados nesta vaga: {filteredCandidates.filter(c => c.status === 'Reprovado').length}
                            </p>
                        </div>
                    )}
                    {activeTab === 'aprovados' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-green-700">
                                <strong>📊 Estatística:</strong> Total de candidatos aprovados nesta vaga: {filteredCandidates.filter(c => c.status === 'Aprovado').length}
                            </p>
                        </div>
                    )}
                    <DragDropContext onDragEnd={onDragEnd}>
                        {layoutMode === 'grid' ? (
                            // Layout em Blocos (Grid)
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {Object.entries(columns).map(([status, candidates]) => (
                                    <Droppable key={status} droppableId={status}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`bg-gray-100 p-4 rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-gray-200' : ''}`}
                                            >
                                                <h3 className="font-semibold text-md text-gray-700 mb-4 flex justify-between items-center px-2">
                                                    <span className="truncate">{status}</span>
                                                    <span className="text-sm font-bold bg-gray-200 text-gray-600 px-3 py-1 rounded-full ml-2">
                                                        {candidates.length}
                                                    </span>
                                                </h3>
                                                <div className="space-y-2 min-h-[250px] p-1 max-h-[600px] overflow-y-auto">
                                                    {candidates.map((candidate, index) => (
                                                        <KanbanCard key={candidate.id} candidate={candidate} index={index} onClick={handleCardClick} />
                                                    ))}
                                                    {candidates.length === 0 && (
                                                        <div className="text-center text-gray-400 py-8">
                                                            {status === 'Reprovado' && activeTab === 'reprovados' ? (
                                                                <div>
                                                                    <p className="text-sm font-medium">🎉 Nenhum candidato reprovado!</p>
                                                                    <p className="text-xs mt-1">Todos os candidatos desta vaga ainda estão ativos no processo seletivo.</p>
                                                                </div>
                                                            ) : status === 'Contratado' && activeTab === 'contratados' ? (
                                                                <div>
                                                                    <p className="text-sm font-medium">Nenhum candidato contratado ainda</p>
                                                                    <p className="text-xs mt-1">Candidatos aprovados aparecerão aqui quando forem contratados.</p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm">Nenhum candidato nesta etapa</p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {provided.placeholder}
                                                </div>
                                            </div>
                                        )}
                                    </Droppable>
                                ))}
                            </div>
                        ) : (
                            // Layout Horizontal (Original)
                            <div className="flex gap-6 overflow-x-auto pb-4">
                                {Object.entries(columns).map(([status, candidates]) => (
                                    <Droppable key={status} droppableId={status}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`w-80 flex-shrink-0 bg-gray-100 p-3 rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-gray-200' : ''}`}
                                            >
                                                <h3 className="font-semibold text-md text-gray-700 mb-4 flex justify-between items-center px-2">
                                                    <span>{status}</span>
                                                    <span className="text-sm font-bold bg-gray-200 text-gray-600 px-3 py-1 rounded-full">
                                                        {candidates.length}
                                                    </span>
                                                </h3>
                                                <div className="space-y-3 min-h-[200px] p-1">
                                                    {candidates.map((candidate, index) => (
                                                        <KanbanCard key={candidate.id} candidate={candidate} index={index} onClick={handleCardClick} />
                                                    ))}
                                                    {candidates.length === 0 && (
                                                        <div className="text-center text-gray-400 py-8">
                                                            {status === 'Reprovado' && activeTab === 'reprovados' ? (
                                                                <div>
                                                                    <p className="text-sm font-medium">🎉 Nenhum candidato reprovado!</p>
                                                                    <p className="text-xs mt-1">Todos os candidatos desta vaga ainda estão ativos no processo seletivo.</p>
                                                                </div>
                                                            ) : status === 'Contratado' && activeTab === 'contratados' ? (
                                                                <div>
                                                                    <p className="text-sm font-medium">Nenhum candidato contratado ainda</p>
                                                                    <p className="text-xs mt-1">Candidatos aprovados aparecerão aqui quando forem contratados.</p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm">Nenhum candidato nesta etapa</p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {provided.placeholder}
                                                </div>
                                            </div>
                                        )}
                                    </Droppable>
                                ))}
                            </div>
                        )}
                    </DragDropContext>
                </>
            ) : (
                <div className="flex flex-1 items-center justify-center p-10 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">Selecione uma vaga para ver os candidatos.</p>
                </div>
            )}

            <CandidateDetailModal
                candidate={selectedCandidate}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                shouldAutoOpenLegalForm={shouldAutoOpenLegalForm}
            />

            <Dialog open={!!candidateToReject} onOpenChange={() => {
                setCandidateToReject(null);
                setRejectionReason("");
                setSelectedRejectionMotif("");
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Motivo da Reprovação</DialogTitle>
                        <DialogDescription>
                            Selecione o motivo da reprovação do candidato "{candidateToReject?.name}". Você pode adicionar observações adicionais no campo de texto.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Motivo da Reprovação *
                            </label>
                            <Select value={selectedRejectionMotif} onValueChange={setSelectedRejectionMotif}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o motivo da reprovação" />
                                </SelectTrigger>
                                <SelectContent>
                                    {rejectionMotifs.map((motif) => (
                                        <SelectItem key={motif} value={motif}>
                                            {motif}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Observações Adicionais (Opcional)
                            </label>
                            <Textarea
                                placeholder="Ex: Detalhes específicos sobre a reprovação..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="min-h-[80px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setCandidateToReject(null);
                            setRejectionReason("");
                            setSelectedRejectionMotif("");
                        }}>Cancelar</Button>
                        <Button
                            onClick={handleConfirmRejection}
                            disabled={(!selectedRejectionMotif && !rejectionReason.trim()) || updateStatus.isPending || createNote.isPending}
                            className="bg-destructive hover:bg-destructive/90 text-white"
                        >
                            {(updateStatus.isPending || createNote.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Confirmar Reprovação"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal para atualizar status da vaga quando candidato é aprovado */}
            <JobStatusUpdateModal
                open={showJobStatusModal}
                onClose={() => {
                    setShowJobStatusModal(false);
                    setPendingApproval(null);
                }}
                onConfirm={handleConfirmJobStatus}
                job={pendingApproval?.job || null}
                candidateName={pendingApproval?.candidate?.name || ''}
                isLoading={updateStatus.isPending || updateJobFlowStatus.isPending}
            />
        </div>
    );
};

export default SelectionProcess;