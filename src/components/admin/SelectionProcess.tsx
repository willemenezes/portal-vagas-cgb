import { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAllJobs, Job } from '@/hooks/useJobs';
import { useCandidates, Candidate, useUpdateCandidateStatus } from '@/hooks/useCandidates';
import { SELECTION_STATUSES, STATUS_COLORS, SelectionStatus } from '@/lib/constants';
import { Loader2, User, Mail, Briefcase } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import CandidateDetailModal from './CandidateDetailModal';
import { useCreateCandidateNote } from '@/hooks/useCandidateNotes';
import { useAuth } from '@/hooks/useAuth';
import { useRHProfile } from '@/hooks/useRH';

const SelectionProcess = () => {
    const { data: allJobs = [], isLoading: isLoadingJobs } = useAllJobs();
    const { data: candidates = [], isLoading: isLoadingCandidates } = useCandidates();
    const updateStatus = useUpdateCandidateStatus();
    const createNote = useCreateCandidateNote();
    const { user } = useAuth();
    const { data: rhProfile } = useRHProfile(user?.id);
    const { toast } = useToast();
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const jobsForSelection = useMemo(() => {
        if (!rhProfile || rhProfile.is_admin) {
            return allJobs; // Admin vê todas as vagas
        }

        return allJobs.filter(job => {
            const hasStateAccess = rhProfile.assigned_states && rhProfile.assigned_states.length > 0 && rhProfile.assigned_states.includes(job.state);
            const hasCityAccess = rhProfile.assigned_cities && rhProfile.assigned_cities.length > 0 && rhProfile.assigned_cities.includes(job.city);

            // Se o RH não tiver nem estado nem cidade atribuída, ele não deve ver nenhuma vaga.
            if (!rhProfile.assigned_states?.length && !rhProfile.assigned_cities?.length) {
                return false;
            }

            // O usuário tem acesso se a vaga estiver em um de seus estados OU cidades.
            return hasStateAccess || hasCityAccess;
        });
    }, [allJobs, rhProfile]);

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
        const cols: Record<SelectionStatus, Candidate[]> = SELECTION_STATUSES.reduce((acc, status) => {
            acc[status] = [];
            return acc;
        }, {} as Record<SelectionStatus, Candidate[]>);

        if (Array.isArray(filteredCandidates)) {
            filteredCandidates.forEach(candidate => {
                const status = SELECTION_STATUSES.includes(candidate.status as any)
                    ? candidate.status as SelectionStatus
                    : "Cadastrado";

                if (cols[status]) {
                    cols[status].push(candidate);
                } else {
                    cols["Cadastrado"].push(candidate);
                }
            });
        }

        return cols;
    }, [filteredCandidates]);

    const mapStatusToLegacy = (status: SelectionStatus): 'pending' | 'approved' | 'rejected' | 'interview' => {
        switch (status) {
            case 'Aprovado':
                return 'approved';
            case 'Reprovado':
                return 'rejected';
            case 'Em Entrevista':
                return 'interview';
            default:
                return 'pending';
        }
    };

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const newStatus = destination.droppableId as SelectionStatus;

        toast({
            title: "Atualizando status...",
            description: `Movendo candidato para ${newStatus}.`,
        });

        updateStatus.mutate({ id: draggableId, status: newStatus }, {
            onSuccess: () => {
                toast({
                    title: "Status atualizado!",
                    description: `O candidato foi movido para ${newStatus}.`,
                });

                // Adicionar nota automática
                if (user) {
                    createNote.mutate({
                        candidate_id: draggableId,
                        author_id: user.id,
                        note: `Status alterado para "${newStatus}"`,
                        activity_type: 'Mudança de Status',
                    });
                }
            },
            onError: (error) => {
                toast({
                    title: "Erro ao atualizar",
                    description: `Não foi possível mover o candidato. ${error.message}`,
                    variant: "destructive",
                });
            }
        });
    };

    if (isLoadingJobs || isLoadingCandidates) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Selecione uma Vaga para Visualizar o Processo</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select onValueChange={setSelectedJobId} value={selectedJobId || ''}>
                        <SelectTrigger className="w-full md:w-1/2">
                            <SelectValue placeholder="Selecione a vaga..." />
                        </SelectTrigger>
                        <SelectContent>
                            {jobsForSelection.map((job: Job) => (
                                <SelectItem key={job.id} value={job.id!}>{job.title} ({job.city}, {job.state})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedJobId && (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {SELECTION_STATUSES.map(status => (
                            <Droppable key={status} droppableId={status}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`bg-gray-100 p-4 rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-gray-200' : ''}`}
                                    >
                                        <h3 className="font-semibold mb-4 flex justify-between items-center">
                                            {status}
                                            <span className="text-sm font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                                                {columns[status]?.length || 0}
                                            </span>
                                        </h3>
                                        <div className="space-y-3 min-h-[200px]">
                                            {columns[status]?.map((candidate, index) => (
                                                <Draggable key={candidate.id} draggableId={candidate.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => handleCardClick(candidate)}
                                                            className={`bg-white p-3 rounded-md shadow-sm border-l-4 cursor-pointer hover:shadow-lg transition-shadow ${STATUS_COLORS[status]?.replace('bg-', 'border-').split(' ')[0]} ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''}`}
                                                        >
                                                            <p className="font-semibold text-sm text-gray-800 flex items-center gap-2"><User className="w-4 h-4" />{candidate.name}</p>
                                                            <p className="text-xs text-gray-500 flex items-center gap-2"><Mail className="w-3 h-3" />{candidate.email}</p>
                                                            <div className="mt-2">
                                                                <Badge variant="secondary" className={`${STATUS_COLORS[status]}`}>{candidate.status}</Badge>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        ))}
                    </div>
                </DragDropContext>
            )}

            <CandidateDetailModal
                candidate={selectedCandidate}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </div>
    );
};

export default SelectionProcess; 