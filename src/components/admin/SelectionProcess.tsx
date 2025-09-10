import { useState, useMemo, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllJobs, Job } from '@/hooks/useJobs';
import { useCandidates, Candidate, useUpdateCandidateStatus } from '@/hooks/useCandidates';
import { SELECTION_STATUSES, SelectionStatus, STATUS_COLORS } from '@/lib/constants';
import { Loader2, PlusCircle, Linkedin, Gavel, Grid3X3, ArrowRightLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import CandidateDetailModal from './CandidateDetailModal';
import { useCreateCandidateNote } from '@/hooks/useCandidateNotes';
import { useAuth } from '@/hooks/useAuth';
import { useRHProfile } from '@/hooks/useRH';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MessageSquare } from 'lucide-react';
import { useAllRejectionNotes } from '@/hooks/useAllRejectionNotes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { differenceInDays, parseISO, isValid } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';

// Helper para obter iniciais do nome
const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    const firstInitial = names[0]?.[0] || '';
    const lastInitial = names.length > 1 ? names[names.length - 1]?.[0] : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
};

// Helper mais robusto para calcular os dias
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
    const daysInStage = getDaysInStage(candidate.created_at);
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
    const { data: allJobs = [], isLoading: isLoadingJobs } = useAllJobs();
    const { data: candidates = [], isLoading: isLoadingCandidates } = useCandidates();
    const updateStatus = useUpdateCandidateStatus();
    const createNote = useCreateCandidateNote();
    const { user } = useAuth();
    const { data: rhProfile, isLoading: isRhProfileLoading } = useRHProfile(user?.id);
    const { toast } = useToast();
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [candidateToReject, setCandidateToReject] = useState<Candidate | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const { data: rejectionNotes = [] } = useAllRejectionNotes();
    const [activeTab, setActiveTab] = useState("ativos");
    const [layoutMode, setLayoutMode] = useState<'grid' | 'horizontal'>('grid');

    const jobsForSelection = useMemo(() => {
        if (isRhProfileLoading) return [];
        if (!rhProfile || rhProfile.is_admin) return allJobs;

        return allJobs.filter(job => {
            // PRIORIDADE 1: Se tem estados atribuídos, verificar se inclui o estado da vaga
            if (rhProfile.assigned_states && rhProfile.assigned_states.length > 0) {
                const hasState = rhProfile.assigned_states.includes(job.state);
                
                // Se tem o estado, verificar se tem cidades específicas
                if (hasState) {
                    // Se tem cidades específicas, verificar se inclui a cidade da vaga
                    if (rhProfile.assigned_cities && rhProfile.assigned_cities.length > 0) {
                        return rhProfile.assigned_cities.includes(job.city);
                    } else {
                        // Tem o estado mas não tem cidades específicas = pode ver todas as cidades do estado
                        return true;
                    }
                }
                return false; // Não tem o estado
            }
            
            // PRIORIDADE 2: Se não tem estados, mas tem cidades específicas
            if (rhProfile.assigned_cities && rhProfile.assigned_cities.length > 0) {
                return rhProfile.assigned_cities.includes(job.city);
            }
            
            return true; // Sem restrições
        });
    }, [allJobs, rhProfile, isRhProfileLoading]);

    useEffect(() => {
        if (!selectedJobId && jobsForSelection.length > 0) {
            setSelectedJobId(jobsForSelection[0].id);
        }
    }, [selectedJobId, jobsForSelection]);

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
    };

    const filteredCandidates = useMemo(() => {
        if (!selectedJobId || !Array.isArray(candidates)) return [];
        return candidates.filter(c => c.job_id === selectedJobId);
    }, [selectedJobId, candidates]);

    const columns = useMemo(() => {
        // Gera as colunas dinamicamente a partir das constantes
        const initialCols = SELECTION_STATUSES.reduce((acc, status) => {
            acc[status] = [];
            return acc;
        }, {} as Record<SelectionStatus, Candidate[]>);

        // Filtra candidatos por aba e distribui nas colunas
        filteredCandidates.forEach(candidate => {
            const status = (candidate.status && SELECTION_STATUSES.includes(candidate.status as any))
                ? candidate.status as SelectionStatus
                : "Cadastrado";

            // Lógica de filtro por aba
            if (activeTab === "ativos") {
                // Na aba ativos, mostra todos exceto contratados (mantém reprovados em suas colunas)
                if (status !== 'Contratado') {
                    if (initialCols[status]) {
                        initialCols[status].push(candidate);
                    }
                }
            } else if (activeTab === "reprovados") {
                // Na aba reprovados, mostra apenas reprovados
                if (status === 'Reprovado') {
                    if (initialCols[status]) {
                        initialCols[status].push(candidate);
                    }
                }
            } else if (activeTab === "contratados") {
                // Na aba contratados, mostra apenas contratados
                if (status === 'Contratado') {
                    if (initialCols[status]) {
                        initialCols[status].push(candidate);
                    }
                }
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
        } else if (activeTab === 'contratados') {
            // Na aba contratados, remove todas as colunas exceto "Contratado"
            Object.keys(initialCols).forEach(key => {
                if (key !== 'Contratado') {
                    delete initialCols[key as SelectionStatus];
                }
            });
        } else if (activeTab === 'ativos') {
            // Na aba ativos, remove a coluna "Contratado" (mantém "Reprovado")
            delete initialCols['Contratado'];
        }
        // Na aba "ativos", mantém todas as colunas exceto "Contratado"

        return initialCols;
    }, [filteredCandidates, activeTab]);

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;

        const candidate = candidates.find(c => c.id === draggableId);
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
        } else {
            // Verificar se o candidato está sendo movido PARA "Validação TJ"
            const shouldResetLegalStatus = newStatus === 'Validação TJ';
            // Verificar se está vindo de uma etapa posterior (ou seja, voltando)
            const isMovingBackward = shouldResetLegalStatus && source.droppableId !== 'Validação TJ';

            updateStatus.mutate({ id: draggableId, status: newStatus }, {
                onSuccess: async () => {
                    // Se movido para Validação TJ (especialmente se voltando de uma etapa posterior), 
                    // resetar o status legal para reativar o bloqueio
                    if (shouldResetLegalStatus) {
                        try {
                            const { error } = await supabase
                                .from('candidates')
                                .update({ legal_status: 'pendente' })
                                .eq('id', draggableId);

                            if (error) {
                                console.error('Erro ao resetar legal_status:', error);
                                toast({ title: "Status atualizado!", description: `O candidato foi movido para ${newStatus}.` });
                            } else {
                                if (isMovingBackward) {
                                    toast({
                                        title: "Status atualizado!",
                                        description: `${candidate.name} retornou para Validação TJ. Nova validação jurídica será necessária.`,
                                        duration: 6000
                                    });
                                } else {
                                    toast({
                                        title: "Status atualizado!",
                                        description: `${candidate.name} foi movido para Validação TJ. Validação jurídica necessária.`,
                                        duration: 5000
                                    });
                                }
                            }
                        } catch (error) {
                            console.error('Erro ao resetar legal_status:', error);
                            toast({ title: "Status atualizado!", description: `O candidato foi movido para ${newStatus}.` });
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
        if (!candidateToReject || !rejectionReason.trim()) {
            toast({ title: "Campo obrigatório", description: "Por favor, preencha o motivo da reprovação.", variant: "destructive" });
            return;
        }
        const { id: candidateId } = candidateToReject;
        try {
            await updateStatus.mutateAsync({ id: candidateId, status: 'Reprovado' });
            if (user) await createNote.mutateAsync({ candidate_id: candidateId, author_id: user.id, note: `Motivo da reprovação: ${rejectionReason}`, activity_type: 'Reprovação' });
            toast({ title: "Candidato reprovado", description: "O status e a nota foram salvos com sucesso." });
        } catch (error: any) {
            toast({ title: "Erro", description: `Não foi possível completar a ação: ${error.message}`, variant: "destructive" });
        } finally {
            setCandidateToReject(null);
            setRejectionReason("");
        }
    };

    if (isLoadingJobs || isLoadingCandidates || isRhProfileLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-cgb-primary" /></div>;
    }

    const selectedJob = allJobs.find(job => job.id === selectedJobId);

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div className="flex-1">
                    <Select onValueChange={setSelectedJobId} value={selectedJobId || ''}>
                        <SelectTrigger className="w-full md:w-96 text-lg font-semibold">
                            <SelectValue placeholder="Selecione a vaga..." />
                        </SelectTrigger>
                        <SelectContent>
                            {jobsForSelection.map((job: Job) => (
                                <SelectItem key={job.id} value={job.id!}>
                                    {job.title} - {job.city}, {job.state}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 ml-4">
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
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="ativos">Ativos</TabsTrigger>
                    <TabsTrigger value="reprovados">Reprovados</TabsTrigger>
                    <TabsTrigger value="contratados">Contratados</TabsTrigger>
                </TabsList>
            </Tabs>

            {selectedJobId ? (
                <>
                    {activeTab === 'reprovados' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-blue-700">
                                <strong>📊 Estatística:</strong> Total de candidatos reprovados nesta vaga: {filteredCandidates.filter(c => c.status === 'Reprovado').length} |
                                Total no sistema: {candidates.filter(c => c.status === 'Reprovado').length}
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

            <CandidateDetailModal candidate={selectedCandidate} isOpen={isModalOpen} onClose={handleCloseModal} />

            <Dialog open={!!candidateToReject} onOpenChange={() => setCandidateToReject(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Motivo da Reprovação</DialogTitle>
                        <DialogDescription>
                            Descreva o motivo pelo qual o candidato "{candidateToReject?.name}" está sendo reprovado. A observação será salva no histórico.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Ex: Perfil técnico não alinhado com os requisitos da vaga..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCandidateToReject(null)}>Cancelar</Button>
                        <Button
                            onClick={handleConfirmRejection}
                            disabled={!rejectionReason.trim() || updateStatus.isPending || createNote.isPending}
                            className="bg-destructive hover:bg-destructive/90 text-white"
                        >
                            {(updateStatus.isPending || createNote.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Confirmar Reprovação"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SelectionProcess;