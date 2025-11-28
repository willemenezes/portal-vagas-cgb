import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Loader2, FileText, Calendar, MapPin, Users, ChevronLeft, ChevronRight, CheckCircle, Clock, Eye, Edit, Trash2, Download, User, UserCheck, XCircle, Building, AlertCircle, ChevronsUpDown } from 'lucide-react';
import { Job, useUpdateJob, useAllJobs, useDeleteJob, usePendingJobs } from '@/hooks/useJobs';
import { useJobRequests } from '@/hooks/useJobRequests';
import { useAuth } from '@/hooks/useAuth';
import { useRHProfile } from '@/hooks/useRH';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { departments } from '@/data/departments';
import { contracts } from '@/data/contracts';
import { WORKLOAD_OPTIONS } from '@/data/workload-options';
import { JobTitleSelect } from './JobTitleSelect';
import { STATES } from '@/data/cities-states';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface IBGEState {
    id: number;
    sigla: string;
    nome: string;
}

interface IBGECity {
    id: number;
    nome: string;
}

const CONTRACT_TYPE_OPTIONS = [
    'CLT',
    'Estágio',
    'Aprendiz',
    'Terceirizado',
    'Temporário',
    'PJ',
    'Freelancer'
];

const JobRequestsManagement = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { data: rhProfile } = useRHProfile(user?.id);
    const { data: allJobs = [], isLoading } = useAllJobs();
    const updateJob = useUpdateJob();
    const deleteJob = useDeleteJob();
    
    // BUG FIX: Usar o hook correto para solicitações de vagas
    const { jobRequests, isLoading: isLoadingRequests, updateJobRequest, createJobFromRequest, isUpdating } = useJobRequests();
    
    // CORREÇÃO: Buscar vagas editadas aguardando aprovação
    const { data: pendingEditedJobs = [], isLoading: isLoadingEditedJobs, refetch: refetchPendingJobs } = usePendingJobs(rhProfile);

    // Filtrar solicitações por status
    const pendingRequests = jobRequests?.filter(req => req.status === 'pendente') || [];
    const approvedRequests = jobRequests?.filter(req => req.status === 'aprovado' && !req.job_created) || [];
    const rejectedRequests = jobRequests?.filter(req => req.status === 'rejeitado') || [];
    
    // DEBUG: Log para admin
    useEffect(() => {
        if (rhProfile?.role === 'admin' && jobRequests) {
            console.log('🔍 [JobRequestsManagement] DEBUG Admin - Todas as solicitações:', jobRequests.length);
            console.log('🔍 [JobRequestsManagement] DEBUG Admin - Pendentes:', pendingRequests.length);
            console.log('🔍 [JobRequestsManagement] DEBUG Admin - Aprovadas:', approvedRequests.length);
            console.log('🔍 [JobRequestsManagement] DEBUG Admin - TESTETI:', jobRequests.find(r => r.title === 'TESTETI'));
        }
    }, [jobRequests, rhProfile, pendingRequests, approvedRequests]);

    const [activeView, setActiveView] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isRejectModalOpen, setRejectModalOpen] = useState(false);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<any>(null);
    const [userNames, setUserNames] = useState<Record<string, string>>({});
    const [editStates, setEditStates] = useState<IBGEState[]>([]);
    const [loadingEditStates, setLoadingEditStates] = useState(false);
    const [editCities, setEditCities] = useState<IBGECity[]>([]);
    const [loadingEditCities, setLoadingEditCities] = useState(false);
    const [isEditCityComboOpen, setIsEditCityComboOpen] = useState(false);

    // Paginação para vagas pendentes
    const [pendingPage, setPendingPage] = useState(0);
    const pendingPageSize = 10;

    // Paginação para vagas aprovadas
    const [approvedPage, setApprovedPage] = useState(0);
    const approvedPageSize = 10;

    // Paginação para vagas reprovadas
    const [rejectedPage, setRejectedPage] = useState(0);
    const rejectedPageSize = 10;

    // Função para buscar nomes dos usuários
    const fetchUserNames = async (jobs: Job[]) => {
        try {
            const userIds = new Set<string>();

            // Coletar todos os IDs únicos de usuários
            jobs.forEach(job => {
                if (job.created_by) userIds.add(job.created_by);
                if (job.approved_by) userIds.add(job.approved_by);
            });

            if (userIds.size === 0) return;

            // Buscar nomes dos usuários
            const { data: users, error} = await supabase
                .from('rh_users')
                .select('user_id, full_name')
                .in('user_id', Array.from(userIds));

            if (error) {
                console.warn('Erro ao buscar nomes de usuários:', error);
                return;
            }

            // Criar mapa de IDs para nomes
            const nameMap: Record<string, string> = {};
            users?.forEach(user => {
                nameMap[user.user_id] = user.full_name || 'Usuário';
            });

            setUserNames(nameMap);
        } catch (error) {
            console.warn('Erro ao buscar nomes de usuários:', error);
        }
    };

    // Buscar nomes quando os jobs carregarem
    useEffect(() => {
        if (allJobs.length > 0) {
            fetchUserNames(allJobs);
        }
    }, [allJobs]);

    useEffect(() => {
        const fetchStates = async () => {
            try {
                setLoadingEditStates(true);
                const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    setEditStates(data);
                } else {
                    setEditStates(STATES.map(state => ({ id: 0, sigla: state.code, nome: state.name })));
                }
            } catch (error) {
                console.error('Erro ao carregar estados para edição:', error);
                setEditStates(STATES.map(state => ({ id: 0, sigla: state.code, nome: state.name })));
            } finally {
                setLoadingEditStates(false);
            }
        };

        fetchStates();
    }, []);

    useEffect(() => {
        if (!editFormData?.state) {
            setEditCities([]);
            return;
        }

        const fetchCities = async () => {
            try {
                setLoadingEditCities(true);
                const stateResponse = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${editFormData.state}`);
                const stateData = await stateResponse.json();

                if (stateData && stateData.id) {
                    const citiesResponse = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateData.id}/municipios?orderBy=nome`);
                    const citiesData = await citiesResponse.json();
                    setEditCities(citiesData);
                } else {
                    setEditCities([]);
                }
            } catch (error) {
                console.error('Erro ao carregar cidades para edição:', error);
                setEditCities([]);
            } finally {
                setLoadingEditCities(false);
            }
        };

        fetchCities();
    }, [editFormData?.state]);

    const getSafeDateLabel = (dateString: string | undefined | null): string => {
        if (!dateString) return 'sem data';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'data inválida';
            return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
        } catch {
            return 'erro de data';
        }
    };

    const formatFullDate = (dateString: string | undefined | null): string => {
        if (!dateString) return 'sem data';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'data inválida';
            return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        } catch {
            return 'erro de data';
        }
    };

    const handleApproval = async (requestId: string) => {
        try {
            // CORREÇÃO: Para solicitações aprovadas, precisamos CRIAR a vaga primeiro
            // usando createJobFromRequest, não atualizar uma vaga que não existe
            await createJobFromRequest.mutateAsync(requestId);
            toast({
                title: '✅ Vaga Publicada!',
                description: 'A vaga foi criada e está ativa e pública no portal.'
            });
        } catch (error: any) {
            console.error('Erro ao publicar vaga:', error);
            toast({
                title: '❌ Erro',
                description: error?.message || 'Não foi possível publicar a vaga.',
                variant: 'destructive'
            });
        }
    };

    const handleRejection = async () => {
        if (!selectedJob || !rejectionReason.trim()) {
            toast({
                title: '⚠️ Atenção',
                description: 'Por favor, forneça um motivo para a rejeição.',
                variant: 'destructive'
            });
            return;
        }
        try {
            // CORREÇÃO CRÍTICA: Verificar se é uma vaga editada (já existia antes)
            // Se for uma vaga editada, ao rejeitar a edição, devemos restaurar o estado anterior (ativa)
            // ao invés de marcar como rejeitada (que faria ela sumir do site)
            const isEditedJob = pendingEditedJobs.some(job => job.id === selectedJob.id);
            
            if (isEditedJob) {
                // Vaga editada: restaurar estado anterior (ativa) ao invés de marcar como rejeitada
                // Isso cancela apenas a edição, mantendo a vaga ativa no site
                console.log('🔄 [JobRequestsManagement] Rejeitando edição de vaga existente - restaurando estado anterior');
                
                // Buscar informações da vaga no banco para verificar se tinha estado anterior
                // Se a vaga tem created_at diferente de updated_at recente, significa que foi editada
                const { data: jobFromDb, error: fetchError } = await supabase
                    .from('jobs')
                    .select('created_at, updated_at, flow_status')
                    .eq('id', selectedJob.id)
                    .single();
                
                if (fetchError) {
                    console.error('❌ [JobRequestsManagement] Erro ao buscar vaga:', fetchError);
                }
                
                // Usar flow_status atual como base (geralmente mantém o estado anterior)
                // Se não tiver, assumir 'ativa' (caso mais comum)
                const restoredFlowStatus = jobFromDb?.flow_status || selectedJob.flow_status || 'ativa';
                
                await updateJob.mutateAsync({
                    id: selectedJob.id,
                    approval_status: 'active', // Restaurar para ativa
                    status: 'active', // Restaurar para ativa
                    flow_status: restoredFlowStatus, // Manter o flow_status (ou restaurar para ativa)
                    rejection_reason: null // Limpar motivo de rejeição já que não é rejeição completa
                });
                
                toast({
                    title: '✅ Edição Cancelada',
                    description: 'A edição foi rejeitada e a vaga voltou ao estado anterior (ativa no site).'
                });
            } else {
                // Nova vaga ou solicitação: marcar como rejeitada normalmente
                console.log('🔄 [JobRequestsManagement] Rejeitando nova vaga/solicitação');
                
                await updateJob.mutateAsync({
                    id: selectedJob.id,
                    approval_status: 'rejected',
                    status: 'draft',
                    rejection_reason: rejectionReason
                });
                
                toast({
                    title: '🔴 Vaga Rejeitada',
                    description: 'A vaga foi devolvida para o solicitante com suas observações.'
                });
            }
            
            setRejectModalOpen(false);
            setRejectionReason('');
            setSelectedJob(null);
        } catch (error) {
            toast({
                title: '❌ Erro',
                description: 'Não foi possível rejeitar a vaga.',
                variant: 'destructive'
            });
        }
    };

    const handleDelete = async (jobId: string, jobTitle: string) => {
        if (!window.confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE a vaga "${jobTitle}"?\n\nEsta ação NÃO pode ser desfeita!`)) {
            return;
        }

        try {
            await deleteJob.mutateAsync(jobId);
            toast({
                title: '🗑️ Vaga Excluída',
                description: `A vaga "${jobTitle}" foi excluída permanentemente.`
            });
        } catch (error) {
            toast({
                title: '❌ Erro',
                description: 'Não foi possível excluir a vaga.',
                variant: 'destructive'
            });
        }
    };

    const generateJobPDF = (job: Job) => {
        try {
            const pdf = new jsPDF();

            // Configurações do PDF
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.text('RELATÓRIO DE VAGA', 20, 30);

            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text(job.title, 20, 50);

            // Informações da vaga
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');

            let yPosition = 70;
            const lineHeight = 7;

            // Informações básicas
            pdf.text(`Departamento: ${job.department}`, 20, yPosition);
            yPosition += lineHeight;

            pdf.text(`Localização: ${job.city}, ${job.state}`, 20, yPosition);
            yPosition += lineHeight;

            pdf.text(`Tipo de Contrato: ${job.type}`, 20, yPosition);
            yPosition += lineHeight;

            pdf.text(`Carga Horária: ${job.workload}`, 20, yPosition);
            yPosition += lineHeight;

            pdf.text(`Quantidade de Vagas: ${job.quantity || 1}`, 20, yPosition);
            yPosition += lineHeight;

            pdf.text(`Data de Criação: ${formatFullDate(job.created_at)}`, 20, yPosition);
            yPosition += lineHeight;

            // Informações de aprovação e status
            yPosition += 10;
            pdf.setFont('helvetica', 'bold');
            pdf.text('INFORMAÇÕES DE APROVAÇÃO', 20, yPosition);
            yPosition += lineHeight;

            pdf.setFont('helvetica', 'normal');

            if (job.approved_by) {
                pdf.text(`Aprovado por: ${userNames[job.approved_by] || 'Não informado'}`, 20, yPosition);
                yPosition += lineHeight;

                if (job.approved_at) {
                    pdf.text(`Data de Aprovação: ${formatFullDate(job.approved_at)}`, 20, yPosition);
                    yPosition += lineHeight;
                }
            }

            // Status atual
            pdf.text(`Status Atual: ${getStatusText(job)}`, 20, yPosition);
            yPosition += lineHeight;

            // Informações do Solicitador (dados inseridos no formulário)
            if (job.solicitante_nome || job.solicitante_funcao || job.justification) {
                yPosition += 10;
                pdf.setFont('helvetica', 'bold');
                pdf.text('DADOS DO SOLICITADOR', 20, yPosition);
                yPosition += lineHeight;

                pdf.setFont('helvetica', 'normal');

                if (job.solicitante_nome) {
                    pdf.text(`Nome do Solicitante: ${job.solicitante_nome}`, 20, yPosition);
                    yPosition += lineHeight;
                }

                if (job.solicitante_funcao) {
                    pdf.text(`Gerente Responsável: ${job.solicitante_funcao}`, 20, yPosition);
                    yPosition += lineHeight;
                }

                if (job.justification) {
                    yPosition += 5;
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Justificativa da Criação:', 20, yPosition);
                    yPosition += lineHeight;

                    pdf.setFont('helvetica', 'normal');
                    const justification = job.justification;
                    const splitJustification = pdf.splitTextToSize(justification, 170);
                    pdf.text(splitJustification, 20, yPosition);
                    yPosition += splitJustification.length * lineHeight;
                }
            }

            // Descrição
            yPosition += 10;
            pdf.setFont('helvetica', 'bold');
            pdf.text('DESCRIÇÃO DA VAGA', 20, yPosition);
            yPosition += lineHeight;

            pdf.setFont('helvetica', 'normal');
            const description = job.description || 'Sem descrição';
            const splitDescription = pdf.splitTextToSize(description, 170);
            pdf.text(splitDescription, 20, yPosition);
            yPosition += splitDescription.length * lineHeight;

            // Requisitos
            if (job.requirements) {
                yPosition += 10;
                pdf.setFont('helvetica', 'bold');
                pdf.text('REQUISITOS', 20, yPosition);
                yPosition += lineHeight;

                pdf.setFont('helvetica', 'normal');
                const requirements = job.requirements;
                const splitRequirements = pdf.splitTextToSize(requirements, 170);
                pdf.text(splitRequirements, 20, yPosition);
            }

            // Justificativa (se houver) - REMOVIDO pois já está na seção "DADOS DO SOLICITADOR"
            // if (job.is_justificativa && job.justification) {
            //     yPosition += 10;
            //     pdf.setFont('helvetica', 'bold');
            //     pdf.text('JUSTIFICATIVA', 20, yPosition);
            //     yPosition += lineHeight;
            //     
            //     pdf.setFont('helvetica', 'normal');
            //     const justification = job.justification;
            //     const splitJustification = pdf.splitTextToSize(justification, 170);
            //     pdf.text(splitJustification, 20, yPosition);
            // }

            // Rodapé
            const pageHeight = pdf.internal.pageSize.height;
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'italic');
            pdf.text(`Relatório gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 20, pageHeight - 20);
            pdf.text('Portal CGB Vagas - Sistema de Gestão de Recursos Humanos', 20, pageHeight - 10);

            // Salvar o PDF
            const fileName = `vaga_${job.title.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
            pdf.save(fileName);

            toast({
                title: '📄 PDF Gerado!',
                description: `Relatório da vaga "${job.title}" foi baixado com sucesso.`
            });

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            toast({
                title: '❌ Erro',
                description: 'Não foi possível gerar o PDF. Tente novamente.',
                variant: 'destructive'
            });
        }
    };

    const getStatusText = (job: Job): string => {
        if (job.flow_status === 'concluida') return 'Concluída';
        if (job.flow_status === 'congelada') return 'Congelada';
        if (job.status === 'active' || job.status === 'ativo') return 'Ativa';
        if (job.approval_status === 'rejected') return 'Rejeitada';
        return 'Indefinido';
    };

    // Solicitações aguardando aprovação da gerência (status = pendente)
    const awaitingApprovalRequests = pendingRequests
        .slice()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const totalAwaitingApproval = awaitingApprovalRequests.length;

    // Solicitações aprovadas que ainda precisam virar vagas (status = aprovado, job_created = false)
    const pendingJobs = approvedRequests
        .slice()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const totalApprovedAwaitingCreation = pendingJobs.length;

    // Filtrar vagas aprovadas/publicadas (usar allJobs - vagas já criadas)
    const approvedJobs = allJobs.filter(job =>
        job.approval_status === 'active' ||
        job.approval_status === 'ativo' ||
        job.status === 'active' ||
        job.status === 'ativo' ||
        job.status === 'concluded' ||
        job.flow_status === 'concluida'
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Paginação para solicitações aprovadas aguardando criação
    const totalPendingJobs = totalAwaitingApproval + totalApprovedAwaitingCreation;
    const totalPendingPages = Math.max(1, Math.ceil(totalApprovedAwaitingCreation / pendingPageSize));
    const pendingStartIndex = pendingPage * pendingPageSize;
    const pendingEndIndex = Math.min(totalApprovedAwaitingCreation, pendingStartIndex + pendingPageSize);
    const paginatedPendingJobs = pendingJobs.slice(pendingStartIndex, pendingEndIndex);

    // Paginação para vagas aprovadas
    const totalApprovedJobs = approvedJobs.length;
    const totalApprovedPages = Math.max(1, Math.ceil(totalApprovedJobs / approvedPageSize));
    const approvedStartIndex = approvedPage * approvedPageSize;
    const approvedEndIndex = Math.min(totalApprovedJobs, approvedStartIndex + approvedPageSize);
    const paginatedApprovedJobs = approvedJobs.slice(approvedStartIndex, approvedEndIndex);

    // Paginação para vagas reprovadas
    const rejectedJobs = rejectedRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const totalRejectedJobs = rejectedJobs.length;
    const totalRejectedPages = Math.max(1, Math.ceil(totalRejectedJobs / rejectedPageSize));
    const rejectedStartIndex = rejectedPage * rejectedPageSize;
    const rejectedEndIndex = Math.min(totalRejectedJobs, rejectedStartIndex + rejectedPageSize);
    const paginatedRejectedJobs = rejectedJobs.slice(rejectedStartIndex, rejectedEndIndex);

    const handlePendingPageChange = (newPage: number) => {
        setPendingPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleApprovedPageChange = (newPage: number) => {
        setApprovedPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRejectedPageChange = (newPage: number) => {
        setRejectedPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getStatusBadge = (job: Job) => {
        if (job.flow_status === 'concluida') {
            return <Badge className="bg-green-600">Concluída</Badge>;
        }
        if (job.flow_status === 'congelada') {
            return <Badge className="bg-blue-500">Congelada</Badge>;
        }
        if (job.status === 'active' || job.status === 'ativo') {
            return <Badge className="bg-green-500">Ativa</Badge>;
        }
        if (job.approval_status === 'rejected') {
            return <Badge className="bg-red-500">Rejeitada</Badge>;
        }
        return <Badge className="bg-gray-500">Indefinido</Badge>;
    };

    const formattedEditCities = editCities.map((city) => ({
        label: city.nome,
        value: city.nome
    }));

    if (isLoadingRequests) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-cgb-primary mr-2" />
                <span className="text-gray-600">Carregando solicitações de vagas...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Solicitações de Vagas</h1>
                    <p className="text-gray-500 mt-1">
                        Gerencie todas as solicitações de vagas dos solicitadores e recrutadores
                    </p>
                </div>
            </div>

            {/* Toggle entre Pendentes, Aprovadas e Reprovadas */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveView('pending')}
                    className={`px-6 py-3 font-semibold transition-all ${activeView === 'pending'
                        ? 'border-b-2 border-cgb-primary text-cgb-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        <span>Aguardando Aprovação</span>
                        {totalPendingJobs > 0 && (
                            <Badge className="bg-amber-500">{totalPendingJobs}</Badge>
                        )}
                    </div>
                </button>
                <button
                    onClick={() => setActiveView('approved')}
                    className={`px-6 py-3 font-semibold transition-all ${activeView === 'approved'
                        ? 'border-b-2 border-cgb-primary text-cgb-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Vagas Aprovadas</span>
                        {totalApprovedJobs > 0 && (
                            <Badge className="bg-green-500">{totalApprovedJobs}</Badge>
                        )}
                    </div>
                </button>
                <button
                    onClick={() => setActiveView('rejected')}
                    className={`px-6 py-3 font-semibold transition-all ${activeView === 'rejected'
                        ? 'border-b-2 border-cgb-primary text-cgb-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5" />
                        <span>Vagas Reprovadas</span>
                        {totalRejectedJobs > 0 && (
                            <Badge className="bg-red-500">{totalRejectedJobs}</Badge>
                        )}
                    </div>
                </button>
            </div>

            {/* Conteúdo */}
            {activeView === 'pending' ? (
                <div className="space-y-6">
                    {/* SOLICITAÇÕES AGUARDANDO APROVAÇÃO DA GERÊNCIA */}
                    {awaitingApprovalRequests.length > 0 && (
                        <Card className="bg-indigo-50 border-indigo-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-indigo-900">
                                    <Clock className="w-6 h-6" />
                                    Solicitações aguardando aprovação da Gerência
                                    <Badge className="bg-indigo-600 ml-auto">
                                        {totalAwaitingApproval} pendente{totalAwaitingApproval !== 1 ? 's' : ''}
                                    </Badge>
                                </CardTitle>
                                <p className="text-sm text-indigo-800 mt-2">
                                    Essas solicitações foram criadas pelos solicitadores e ainda não passaram pela aprovação da gerência.
                                    Os administradores podem acompanhar o andamento e visualizar os detalhes completos.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {awaitingApprovalRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="p-6 border-2 border-indigo-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                            <div className="flex-grow">
                                                <div className="flex items-start gap-3 mb-2">
                                                    <h3 className="font-bold text-xl text-gray-900">{request.title}</h3>
                                                    <Badge className="bg-amber-500 text-white flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Gerência pendente
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-indigo-500" />
                                                        <span>{request.department}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-indigo-500" />
                                                        <span>{request.city}, {request.state}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-indigo-500" />
                                                        <span>{request.quantity || 1} vaga{(request.quantity || 1) > 1 ? 's' : ''}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                                        <span className="text-xs">Criado {getSafeDateLabel(request.created_at)}</span>
                                                    </div>
                                                </div>
                                                {request.description && (
                                                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                                                        {request.description}
                                                    </p>
                                                )}
                                                {request.justification && (
                                                    <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-md text-xs text-indigo-900">
                                                        <strong>Justificativa do solicitante:</strong> {request.justification}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedJob(request as any);
                                                        setDetailModalOpen(true);
                                                    }}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Ver Detalhes
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* VAGAS EDITADAS AGUARDANDO APROVAÇÃO */}
                    {pendingEditedJobs.length > 0 && (
                        <Card className="bg-blue-50 border-blue-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-900">
                                    <FileText className="w-6 h-6" />
                                    Vagas Editadas Aguardando Aprovação
                                    <Badge className="bg-blue-600 ml-auto">{pendingEditedJobs.length} pendente{pendingEditedJobs.length !== 1 ? 's' : ''}</Badge>
                                </CardTitle>
                                <p className="text-sm text-blue-800 mt-2">
                                    Essas vagas foram editadas e precisam ser aprovadas novamente antes de serem publicadas no portal
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {pendingEditedJobs.map((job) => (
                                    <div
                                        key={job.id}
                                        className="p-6 border-2 border-blue-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                            <div className="flex-grow">
                                                <div className="flex items-start gap-3 mb-2">
                                                    <h3 className="font-bold text-xl text-gray-900">{job.title}</h3>
                                                    <Badge className="bg-yellow-500">Aguardando Aprovação</Badge>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                                                        <div className="flex items-center gap-1">
                                                            <Building className="w-4 h-4 text-gray-500" />
                                                            <span>{job.department}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="w-4 h-4 text-gray-500" />
                                                            <span>{job.city}, {job.state}</span>
                                                        </div>
                                                        {job.company_contract && (
                                                            <div className="flex items-center gap-1">
                                                                <FileText className="w-4 h-4 text-gray-500" />
                                                                <span>{job.company_contract}</span>
                                                            </div>
                                                        )}
                                                        {job.quantity && job.quantity > 1 && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-semibold">{job.quantity} vagas</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                                                    
                                                    {/* NOVA: Observação sobre o status solicitado */}
                                                    {job.flow_status && (job.flow_status === 'concluida' || job.flow_status === 'congelada') && (
                                                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                                            <div className="flex items-start gap-2">
                                                                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                                <div className="text-xs text-blue-800">
                                                                    <strong>Observação:</strong> Esta vaga foi editada e o recrutador solicitou que seja marcada como{' '}
                                                                    <strong>
                                                                        {job.flow_status === 'concluida' ? 'Concluída' : job.flow_status === 'congelada' ? 'Congelada' : job.flow_status}
                                                                    </strong>.
                                                                    {' '}Ao aprovar, a vaga será mantida como{' '}
                                                                    <strong>
                                                                        {job.flow_status === 'concluida' ? 'Concluída' : job.flow_status === 'congelada' ? 'Congelada' : job.flow_status}
                                                                    </strong>.
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        Última atualização: {new Date(job.updated_at || job.created_at).toLocaleString('pt-BR')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col lg:flex-row gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedJob(job);
                                                        setDetailModalOpen(true);
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    Ver Detalhes
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={async () => {
                                                        try {
                                                            // CORREÇÃO: Manter o flow_status original ao invés de sempre marcar como 'ativa'
                                                            const finalFlowStatus = job.flow_status || 'ativa';
                                                            const statusLabel = finalFlowStatus === 'concluida' ? 'Concluída' : 
                                                                                finalFlowStatus === 'congelada' ? 'Congelada' : 'Ativa';
                                                            
                                                            await updateJob.mutateAsync({
                                                                id: job.id,
                                                                approval_status: 'active',
                                                                status: 'active',
                                                                flow_status: finalFlowStatus // Manter o status original solicitado
                                                            });
                                                            toast({ 
                                                                title: 'Vaga Aprovada!', 
                                                                description: `A vaga foi aprovada e está marcada como ${statusLabel}.` 
                                                            });
                                                            refetchPendingJobs();
                                                        } catch (error) {
                                                            toast({ title: 'Erro', description: 'Não foi possível aprovar a vaga.', variant: 'destructive' });
                                                        }
                                                    }}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Aprovar
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedJob(job);
                                                        setRejectModalOpen(true);
                                                    }}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    Rejeitar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                    
                    {/* SOLICITAÇÕES APROVADAS PARA CRIAÇÃO */}
                    <Card className="bg-amber-50 border-amber-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-900">
                                <Clock className="w-6 h-6" />
                                Solicitações Aprovadas para Criação
                                <Badge className="bg-amber-600 ml-auto">{totalApprovedAwaitingCreation} pendente{totalApprovedAwaitingCreation !== 1 ? 's' : ''}</Badge>
                            </CardTitle>
                            <p className="text-sm text-amber-800 mt-2">
                                Revise, edite ou publique as vagas aprovadas pelos gerentes
                            </p>
                        </CardHeader>
                        <CardContent>
                        {paginatedPendingJobs.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                    Nenhuma vaga aguardando aprovação
                                </h3>
                                <p className="text-gray-600">
                                    Todas as solicitações foram processadas!
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {paginatedPendingJobs.map((job) => (
                                        <div
                                            key={job.id}
                                            className="p-6 border-2 border-amber-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                                <div className="flex-grow">
                                                    <div className="flex items-start gap-3 mb-2">
                                                        <h3 className="font-bold text-xl text-gray-900">{job.title}</h3>
                                                        {job.is_justificativa && (
                                                            <Badge className="bg-orange-500 text-white">
                                                                ⚠️ Justificativa
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600 mt-3">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-cgb-primary" />
                                                            <span className="font-medium">{job.department}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-4 h-4 text-cgb-primary" />
                                                            <span>{job.city}, {job.state}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Users className="w-4 h-4 text-cgb-primary" />
                                                            <span>{job.quantity || 1} vaga{(job.quantity || 1) > 1 ? 's' : ''}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-cgb-primary" />
                                                            <span className="text-xs">Criado {getSafeDateLabel(job.created_at)}</span>
                                                        </div>
                                                        {job.approved_by_name && (
                                                            <div className="flex items-center gap-2 col-span-2">
                                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                                <span className="text-xs text-green-700">
                                                                    Aprovado por: <strong>{job.approved_by_name}</strong>
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0 flex flex-wrap gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedJob(job);
                                                            setDetailModalOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" /> Ver Detalhes
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                                        onClick={() => {
                                                            // Garantir que todos os valores sejam tipos primitivos válidos
                                                            const formData = {
                                                                id: String(job.id || ''),
                                                                title: typeof job.title === 'string' ? job.title : String(job.title || ''),
                                                                department: typeof job.department === 'string' ? job.department : String(job.department || ''),
                                                                city: typeof job.city === 'string' ? job.city : String(job.city || ''),
                                                                state: typeof job.state === 'string' ? job.state : String(job.state || ''),
                                                                type: typeof job.type === 'string' ? job.type : String(job.type || 'CLT'),
                                                                description: typeof job.description === 'string' ? job.description : String(job.description || ''),
                                                                requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : (typeof job.requirements === 'string' ? job.requirements : ''),
                                                                benefits: Array.isArray(job.benefits) ? job.benefits.join('\n') : (typeof job.benefits === 'string' ? job.benefits : ''),
                                                                workload: typeof job.workload === 'string' ? job.workload : String(job.workload || '40h/semana'),
                                                                justification: typeof job.justification === 'string' ? job.justification : String(job.justification || ''),
                                                                quantity: typeof job.quantity === 'number' ? job.quantity : (Number(job.quantity) || 1),
                                                                company_contract: typeof job.company_contract === 'string' ? job.company_contract : String(job.company_contract || ''),
                                                                solicitante_nome: typeof job.solicitante_nome === 'string' ? job.solicitante_nome : String(job.solicitante_nome || ''),
                                                                solicitante_funcao: typeof job.solicitante_funcao === 'string' ? job.solicitante_funcao : String(job.solicitante_funcao || ''),
                                                                observacoes_internas: typeof job.observacoes_internas === 'string' ? job.observacoes_internas : String(job.observacoes_internas || ''),
                                                                tipo_solicitacao: typeof job.tipo_solicitacao === 'string' ? job.tipo_solicitacao : String(job.tipo_solicitacao || 'aumento_quadro'),
                                                                nome_substituido: typeof job.nome_substituido === 'string' ? job.nome_substituido : String(job.nome_substituido || '')
                                                            };
                                                            
                                                            console.log('📝 [Edit] Dados do formulário:', formData);
                                                            setEditFormData(formData);
                                                            setIsEditModalOpen(true);
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4 mr-1" /> Editar
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                                        onClick={() => {
                                                            setSelectedJob(job);
                                                            setRejectModalOpen(true);
                                                        }}
                                                    >
                                                        <X className="w-4 h-4 mr-1" /> Rejeitar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-500 hover:bg-green-600 text-white"
                                                        onClick={() => handleApproval(job.id)}
                                                        disabled={createJobFromRequest.isPending}
                                                    >
                                                        {createJobFromRequest.isPending ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                                Publicando...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Check className="w-4 h-4 mr-1" /> Publicar Vaga
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Paginação para Pendentes */}
                                {totalPendingPages > 1 && (
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-amber-200">
                                        <div className="text-sm text-gray-600">
                                            Mostrando {pendingStartIndex + 1} a {pendingEndIndex} de {totalApprovedAwaitingCreation} solicitações
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePendingPageChange(0)}
                                                disabled={pendingPage === 0}
                                            >
                                                Primeira
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePendingPageChange(Math.max(0, pendingPage - 1))}
                                                disabled={pendingPage === 0}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            <span className="px-3 py-1 text-sm font-medium">
                                                Página {pendingPage + 1} de {totalPendingPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePendingPageChange(Math.min(totalPendingPages - 1, pendingPage + 1))}
                                                disabled={pendingPage >= totalPendingPages - 1}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePendingPageChange(totalPendingPages - 1)}
                                                disabled={pendingPage >= totalPendingPages - 1}
                                            >
                                                Última
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        </CardContent>
                    </Card>
                </div>
            ) : activeView === 'approved' ? (
                <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-900">
                            <CheckCircle className="w-6 h-6" />
                            Vagas Aprovadas e Publicadas
                            <Badge className="bg-green-600 ml-auto">{totalApprovedJobs} vaga{totalApprovedJobs !== 1 ? 's' : ''}</Badge>
                        </CardTitle>
                        <p className="text-sm text-green-800 mt-2">
                            Histórico completo de todas as vagas aprovadas e publicadas no portal
                        </p>
                    </CardHeader>
                    <CardContent>
                        {paginatedApprovedJobs.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg">
                                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                    Nenhuma vaga aprovada ainda
                                </h3>
                                <p className="text-gray-600">
                                    As vagas aprovadas aparecerão aqui.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {paginatedApprovedJobs.map((job) => (
                                        <div
                                            key={job.id}
                                            className="p-6 border border-green-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
                                                        {getStatusBadge(job)}
                                                    </div>

                                                    {/* Informações básicas */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600 mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-gray-500" />
                                                            <span>{job.department}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-4 h-4 text-gray-500" />
                                                            <span>{job.city}, {job.state}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Users className="w-4 h-4 text-gray-500" />
                                                            <span>{job.quantity || 1} vaga{(job.quantity || 1) > 1 ? 's' : ''}</span>
                                                        </div>
                                                    </div>

                                                    {/* Informações de aprovação */}
                                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                        <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                                                            <UserCheck className="w-4 h-4" />
                                                            Informações de Aprovação
                                                        </h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-blue-500" />
                                                                <span className="text-gray-600">Data criação:</span>
                                                                <span className="font-medium text-gray-900">
                                                                    {formatFullDate(job.created_at)}
                                                                </span>
                                                            </div>
                                                            {job.approved_by && (
                                                                <>
                                                                    <div className="flex items-center gap-2">
                                                                        <UserCheck className="w-4 h-4 text-green-500" />
                                                                        <span className="text-gray-600">Aprovado por:</span>
                                                                        <span className="font-medium text-gray-900">
                                                                            {job.approved_by ? (userNames[job.approved_by] || 'Não informado') : 'Não informado'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                                        <span className="text-gray-600">Data aprovação:</span>
                                                                        <span className="font-medium text-gray-900">
                                                                            {formatFullDate(job.approved_at)}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Dados do Solicitador */}
                                                    {(job.solicitante_nome || job.solicitante_funcao || job.justification) && (
                                                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                            <h4 className="font-semibold text-sm text-blue-700 mb-3 flex items-center gap-2">
                                                                <FileText className="w-4 h-4" />
                                                                Dados do Solicitador
                                                            </h4>
                                                            <div className="space-y-2 text-sm">
                                                                {job.solicitante_nome && (
                                                                    <div className="flex items-center gap-2">
                                                                        <User className="w-4 h-4 text-blue-500" />
                                                                        <span className="text-blue-600">Nome do Solicitante:</span>
                                                                        <span className="font-medium text-blue-900">{job.solicitante_nome}</span>
                                                                    </div>
                                                                )}
                                                                {job.solicitante_funcao && (
                                                                    <div className="flex items-center gap-2">
                                                                        <UserCheck className="w-4 h-4 text-blue-500" />
                                                                        <span className="text-blue-600">Gerente Responsável:</span>
                                                                        <span className="font-medium text-blue-900">{job.solicitante_funcao}</span>
                                                                    </div>
                                                                )}
                                                                {job.justification && (
                                                                    <div className="mt-3">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <FileText className="w-4 h-4 text-blue-500" />
                                                                            <span className="text-blue-600 font-medium">Justificativa da Criação:</span>
                                                                        </div>
                                                                        <div className="bg-white rounded p-3 border border-blue-200">
                                                                            <p className="text-blue-900 text-sm whitespace-pre-wrap">{job.justification}</p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-shrink-0 flex flex-col gap-2">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedJob(job);
                                                                setDetailModalOpen(true);
                                                            }}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            Ver Detalhes
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => generateJobPDF(job)}
                                                            className="flex items-center gap-1 text-blue-600 hover:bg-blue-50"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                            Gerar PDF
                                                        </Button>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 hover:bg-red-50 border-red-200"
                                                        onClick={() => handleDelete(job.id, job.title)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1" />
                                                        Excluir
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Paginação para Aprovadas */}
                                {totalApprovedPages > 1 && (
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-green-200">
                                        <div className="text-sm text-gray-600">
                                            Mostrando {approvedStartIndex + 1} a {approvedEndIndex} de {totalApprovedJobs} vagas
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleApprovedPageChange(0)}
                                                disabled={approvedPage === 0}
                                            >
                                                Primeira
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleApprovedPageChange(Math.max(0, approvedPage - 1))}
                                                disabled={approvedPage === 0}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            <span className="px-3 py-1 text-sm font-medium">
                                                Página {approvedPage + 1} de {totalApprovedPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleApprovedPageChange(Math.min(totalApprovedPages - 1, approvedPage + 1))}
                                                disabled={approvedPage >= totalApprovedPages - 1}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleApprovedPageChange(totalApprovedPages - 1)}
                                                disabled={approvedPage >= totalApprovedPages - 1}
                                            >
                                                Última
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card className="bg-red-50 border-red-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-900">
                            <XCircle className="w-6 h-6" />
                            Vagas Reprovadas
                            <Badge className="bg-red-600 ml-auto">{totalRejectedJobs} reprovada{totalRejectedJobs !== 1 ? 's' : ''}</Badge>
                        </CardTitle>
                        <p className="text-sm text-red-800 mt-2">
                            Histórico de todas as solicitações reprovadas pelos gerentes
                        </p>
                    </CardHeader>
                    <CardContent>
                        {paginatedRejectedJobs.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg">
                                <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                    Nenhuma vaga reprovada ainda
                                </h3>
                                <p className="text-gray-600">
                                    As vagas reprovadas aparecerão aqui.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {paginatedRejectedJobs.map((request) => (
                                        <div
                                            key={request.id}
                                            className="p-6 border border-red-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <h3 className="font-bold text-lg text-gray-900">{request.title}</h3>
                                                        <Badge className="bg-red-600">Reprovado</Badge>
                                                    </div>

                                                    {/* Informações básicas */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600 mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-gray-500" />
                                                            <span>{request.department}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-4 h-4 text-gray-500" />
                                                            <span>{request.city}, {request.state}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-gray-500" />
                                                            <span>{request.workload}</span>
                                                        </div>
                                                    </div>

                                                    {/* Informações de reprovação */}
                                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                        <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                                                            <XCircle className="w-4 h-4 text-red-500" />
                                                            Informações de Reprovação
                                                        </h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-blue-500" />
                                                                <span className="text-gray-600">Data criação:</span>
                                                                <span className="font-medium text-gray-900">
                                                                    {formatFullDate(request.created_at)}
                                                                </span>
                                                            </div>
                                                            {request.approved_by && (
                                                                <>
                                                                    <div className="flex items-center gap-2">
                                                                        <User className="w-4 h-4 text-red-500" />
                                                                        <span className="text-gray-600">Rejeitado por:</span>
                                                                        <span className="font-medium text-gray-900">
                                                                            {request.approved_by}
                                                                        </span>
                                                                    </div>
                                                                    {request.approved_at && (
                                                                        <div className="flex items-center gap-2">
                                                                            <XCircle className="w-4 h-4 text-red-500" />
                                                                            <span className="text-gray-600">Data reprovação:</span>
                                                                            <span className="font-medium text-gray-900">
                                                                                {formatFullDate(request.approved_at)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Observações do gerente */}
                                                    {request.notes && (
                                                        <div className="bg-red-50 rounded-lg p-4 border border-red-200 mt-4">
                                                            <h4 className="font-semibold text-sm text-red-700 mb-2 flex items-center gap-2">
                                                                <FileText className="w-4 h-4" />
                                                                Observações do Gerente
                                                            </h4>
                                                            <p className="text-red-900 text-sm whitespace-pre-wrap">{request.notes}</p>
                                                        </div>
                                                    )}

                                                    {/* Descrição */}
                                                    {request.description && (
                                                        <div className="mt-4">
                                                            <h4 className="font-semibold text-sm text-gray-700 mb-2">Descrição:</h4>
                                                            <p className="text-gray-600 text-sm">{request.description}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-shrink-0 flex flex-col gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedJob(request as any);
                                                            setDetailModalOpen(true);
                                                        }}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Ver Detalhes
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Paginação para Reprovadas */}
                                {totalRejectedPages > 1 && (
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-red-200">
                                        <div className="text-sm text-gray-600">
                                            Mostrando {rejectedStartIndex + 1} a {rejectedEndIndex} de {totalRejectedJobs} solicitações
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRejectedPageChange(0)}
                                                disabled={rejectedPage === 0}
                                            >
                                                Primeira
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRejectedPageChange(Math.max(0, rejectedPage - 1))}
                                                disabled={rejectedPage === 0}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            <span className="px-3 py-1 text-sm font-medium">
                                                Página {rejectedPage + 1} de {totalRejectedPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRejectedPageChange(Math.min(totalRejectedPages - 1, rejectedPage + 1))}
                                                disabled={rejectedPage >= totalRejectedPages - 1}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRejectedPageChange(totalRejectedPages - 1)}
                                                disabled={rejectedPage >= totalRejectedPages - 1}
                                            >
                                                Última
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Modal de Rejeição */}
            <Dialog open={isRejectModalOpen} onOpenChange={setRejectModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rejeitar Vaga: {selectedJob?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                            Motivo da Rejeição (Obrigatório)
                        </label>
                        <Textarea
                            id="rejectionReason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Ex: Faltam detalhes sobre as responsabilidades do cargo, requisitos não especificados..."
                            rows={4}
                            className="w-full"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRejectModalOpen(false);
                                setRejectionReason('');
                                setSelectedJob(null);
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejection}
                            disabled={updateJob.isPending || !rejectionReason.trim()}
                        >
                            {updateJob.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                            Confirmar Rejeição
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Detalhes */}
            <Dialog open={isDetailModalOpen} onOpenChange={setDetailModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">{selectedJob?.title}</DialogTitle>
                    </DialogHeader>
                    {selectedJob && (
                        <div className="space-y-6 py-4">
                            {/* Informações Gerais */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Departamento</label>
                                    <p className="text-base font-semibold text-gray-900">{selectedJob.department}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Localização</label>
                                    <p className="text-base font-semibold text-gray-900">{selectedJob.city}, {selectedJob.state}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Tipo de Contrato</label>
                                    <p className="text-base font-semibold text-gray-900">{selectedJob.type}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Carga Horária</label>
                                    <p className="text-base font-semibold text-gray-900">{selectedJob.workload}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Quantidade de Vagas</label>
                                    <p className="text-base font-semibold text-gray-900">{selectedJob.quantity || 1}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Data de Criação</label>
                                    <p className="text-base font-semibold text-gray-900">{formatFullDate(selectedJob.created_at)}</p>
                                </div>
                            </div>

                            {/* Descrição */}
                            <div>
                                <label className="text-sm font-medium text-gray-500 block mb-2">Descrição da Vaga</label>
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-gray-800 whitespace-pre-wrap">{selectedJob.description}</p>
                                </div>
                            </div>

                            {/* Requisitos */}
                            {selectedJob.requirements && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500 block mb-2">Requisitos</label>
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="text-gray-800 whitespace-pre-wrap">{selectedJob.requirements}</p>
                                    </div>
                                </div>
                            )}

                            {/* Informações de aprovação */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <UserCheck className="w-5 h-5 text-blue-600" />
                                    <span className="font-semibold text-blue-900">Informações de Aprovação</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-blue-700 font-medium">Data de Criação:</span>
                                        <p className="text-blue-900 font-semibold">
                                            {formatFullDate(selectedJob.created_at)}
                                        </p>
                                    </div>
                                    {selectedJob.approved_by && (
                                        <>
                                            <div>
                                                <span className="text-green-700 font-medium">Aprovado por:</span>
                                                <p className="text-green-900 font-semibold">
                                                    {userNames[selectedJob.approved_by] || 'Não informado'}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-green-700 font-medium">Data de Aprovação:</span>
                                                <p className="text-green-900 font-semibold">
                                                    {formatFullDate(selectedJob.approved_at)}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Dados do Solicitador */}
                            {(selectedJob.solicitante_nome || selectedJob.solicitante_funcao || selectedJob.justification) && (
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        <span className="font-semibold text-blue-900">Dados do Solicitador</span>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        {selectedJob.solicitante_nome && (
                                            <div>
                                                <span className="text-blue-700 font-medium">Nome do Solicitante:</span>
                                                <p className="text-blue-900 font-semibold">{selectedJob.solicitante_nome}</p>
                                            </div>
                                        )}
                                        {selectedJob.solicitante_funcao && (
                                            <div>
                                                <span className="text-blue-700 font-medium">Gerente Responsável:</span>
                                                <p className="text-blue-900 font-semibold">{selectedJob.solicitante_funcao}</p>
                                            </div>
                                        )}
                                        {selectedJob.justification && (
                                            <div>
                                                <span className="text-blue-700 font-medium">Justificativa da Criação:</span>
                                                <div className="mt-2 p-3 bg-white rounded border border-blue-200">
                                                    <p className="text-blue-900 whitespace-pre-wrap">{selectedJob.justification}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => generateJobPDF(selectedJob)}
                                className="flex items-center gap-2 text-blue-600 hover:bg-blue-50"
                            >
                                <Download className="w-4 h-4" />
                                Gerar PDF
                            </Button>
                            <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                                Fechar
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Edição */}
            {editFormData && (
            <Dialog open={isEditModalOpen} onOpenChange={(open) => {
                setIsEditModalOpen(open);
                if (!open) {
                    setEditFormData(null);
                }
            }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Solicitação: {editFormData.title}</DialogTitle>
                        <DialogDescription>
                            Edite os campos da solicitação antes de publicar a vaga
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <JobTitleSelect
                                    id="edit-title"
                                    value={String(editFormData.title || '')}
                                    onChange={(value) => setEditFormData({ ...editFormData, title: value })}
                                    required
                                    maxLength={255}
                                    showCharCount
                                />
                                <div className="space-y-2">
                                    <Label htmlFor="edit-department">Departamento *</Label>
                                    <Select
                                        value={editFormData.department || ''}
                                        onValueChange={(value) => setEditFormData({ ...editFormData, department: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o departamento" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map((dept) => (
                                                <SelectItem key={dept} value={dept}>
                                                    {dept}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-city">Cidade *</Label>
                                    <Popover open={isEditCityComboOpen} onOpenChange={setIsEditCityComboOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={isEditCityComboOpen}
                                                className="w-full justify-between"
                                                disabled={!editFormData.state || loadingEditCities}
                                            >
                                                {loadingEditCities ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Carregando cidades...
                                                    </>
                                                ) : editFormData.city ? (
                                                    formattedEditCities.find(city => city.value === editFormData.city)?.label || editFormData.city
                                                ) : (
                                                    "Selecione a cidade..."
                                                )}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Pesquisar cidade..." />
                                                <CommandList>
                                                    {loadingEditCities ? (
                                                        <CommandEmpty>
                                                            <div className="flex items-center justify-center py-4">
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Carregando cidades...
                                                            </div>
                                                        </CommandEmpty>
                                                    ) : (
                                                        <>
                                                            <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                                                            <CommandGroup>
                                                                {formattedEditCities.map((city) => (
                                                                    <CommandItem
                                                                        key={city.value}
                                                                        value={city.label}
                                                                        onSelect={() => {
                                                                            setEditFormData({ ...editFormData, city: city.value });
                                                                            setIsEditCityComboOpen(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={`mr-2 h-4 w-4 ${editFormData.city === city.value ? 'opacity-100' : 'opacity-0'}`}
                                                                        />
                                                                        {city.label}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </>
                                                    )}
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {!editFormData.state && (
                                        <p className="text-xs text-gray-500">
                                            Selecione primeiro o estado
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-state">Estado *</Label>
                                    <Select
                                        value={editFormData.state || ''}
                                        onValueChange={(value) => setEditFormData({ ...editFormData, state: value, city: '' })}
                                        disabled={loadingEditStates}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={loadingEditStates ? "Carregando estados..." : "Selecione o estado"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(editStates.length > 0 ? editStates : STATES.map(state => ({ sigla: state.code, nome: state.name }))).map((state) => (
                                                <SelectItem key={state.sigla} value={state.sigla}>
                                                    {state.nome}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {loadingEditStates && (
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Carregando estados...
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-type">Tipo de Contrato *</Label>
                                    <Select
                                        value={editFormData.type || 'CLT'}
                                        onValueChange={(value) => setEditFormData({ ...editFormData, type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo de contrato" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CONTRACT_TYPE_OPTIONS.map((contractType) => (
                                                <SelectItem key={contractType} value={contractType}>
                                                    {contractType}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-workload">Carga Horária *</Label>
                                    <Select
                                        value={editFormData.workload || '40h/semana'}
                                        onValueChange={(value) => setEditFormData({ ...editFormData, workload: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {WORKLOAD_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-quantity">Quantidade de Vagas *</Label>
                                    <Input
                                        id="edit-quantity"
                                        type="number"
                                        min="1"
                                        value={typeof editFormData.quantity === 'number' ? editFormData.quantity : 1}
                                        onChange={(e) => setEditFormData({ ...editFormData, quantity: parseInt(e.target.value) || 1 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-company-contract">CT (Contrato) *</Label>
                                    <Select
                                        value={editFormData.company_contract || ''}
                                        onValueChange={(value) => setEditFormData({ ...editFormData, company_contract: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o contrato" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {contracts.map((contract) => (
                                                <SelectItem key={contract} value={contract}>
                                                    {contract}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Descrição *</Label>
                                <Textarea
                                    id="edit-description"
                                    value={String(editFormData.description || '')}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    rows={5}
                                    placeholder="Descreva as responsabilidades e atividades da vaga..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-requirements">Requisitos (um por linha)</Label>
                                <Textarea
                                    id="edit-requirements"
                                    value={
                                        Array.isArray(editFormData.requirements) 
                                            ? editFormData.requirements.join('\n') 
                                            : (editFormData.requirements || '')
                                    }
                                    onChange={(e) => setEditFormData({ ...editFormData, requirements: e.target.value })}
                                    rows={4}
                                    placeholder="Ensino médio completo&#10;Experiência com vendas&#10;CNH categoria B"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-benefits">Benefícios (um por linha)</Label>
                                <Textarea
                                    id="edit-benefits"
                                    value={
                                        Array.isArray(editFormData.benefits) 
                                            ? editFormData.benefits.join('\n') 
                                            : (editFormData.benefits || '')
                                    }
                                    onChange={(e) => setEditFormData({ ...editFormData, benefits: e.target.value })}
                                    rows={4}
                                    placeholder="Vale transporte&#10;Vale refeição&#10;Plano de saúde"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-justification">Justificativa *</Label>
                                <Textarea
                                    id="edit-justification"
                                    value={String(editFormData.justification || '')}
                                    onChange={(e) => setEditFormData({ ...editFormData, justification: e.target.value })}
                                    rows={3}
                                    placeholder="Justifique a necessidade desta vaga..."
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-solicitante-nome">Nome do Solicitante</Label>
                                    <Input
                                        id="edit-solicitante-nome"
                                        value={String(editFormData.solicitante_nome || '')}
                                        onChange={(e) => setEditFormData({ ...editFormData, solicitante_nome: e.target.value })}
                                        placeholder="Ex: João Silva"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-solicitante-funcao">Gerente Responsável</Label>
                                    <Input
                                        id="edit-solicitante-funcao"
                                        value={String(editFormData.solicitante_funcao || '')}
                                        onChange={(e) => setEditFormData({ ...editFormData, solicitante_funcao: e.target.value })}
                                        placeholder="Ex: Fernando Sousa - Gerente Tático - CT 150.35"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-observacoes">Observações Internas</Label>
                                <Textarea
                                    id="edit-observacoes"
                                    value={String(editFormData.observacoes_internas || '')}
                                    onChange={(e) => setEditFormData({ ...editFormData, observacoes_internas: e.target.value })}
                                    rows={3}
                                    placeholder="Observações adicionais para controle interno..."
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-tipo-solicitacao">Tipo de Solicitação *</Label>
                                    <Select
                                        value={editFormData.tipo_solicitacao || 'aumento_quadro'}
                                        onValueChange={(value) => setEditFormData({ ...editFormData, tipo_solicitacao: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo de solicitação" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="aumento_quadro">Aumento de Quadro</SelectItem>
                                            <SelectItem value="substituicao">Substituição</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {editFormData.tipo_solicitacao === 'substituicao' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-nome-substituido">Nome do Substituído</Label>
                                        <Input
                                            id="edit-nome-substituido"
                                            value={String(editFormData.nome_substituido || '')}
                                            onChange={(e) => setEditFormData({ ...editFormData, nome_substituido: e.target.value })}
                                            placeholder="Digite 1 nome por linha"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsEditModalOpen(false);
                                setEditFormData(null);
                            }}
                            disabled={isUpdating}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={async () => {
                                if (!editFormData) return;
                                    
                                    try {
                                        await updateJobRequest.mutateAsync({
                                            id: editFormData.id,
                                            data: {
                                                title: editFormData.title,
                                                department: editFormData.department,
                                                city: editFormData.city,
                                                state: editFormData.state,
                                                type: editFormData.type,
                                                description: editFormData.description,
                                                requirements: editFormData.requirements.split('\n').filter(r => r.trim() !== ''),
                                                benefits: editFormData.benefits.split('\n').filter(b => b.trim() !== ''),
                                                workload: editFormData.workload,
                                                justification: editFormData.justification,
                                                quantity: editFormData.quantity,
                                                company_contract: editFormData.company_contract,
                                                solicitante_nome: editFormData.solicitante_nome,
                                                solicitante_funcao: editFormData.solicitante_funcao,
                                                observacoes_internas: editFormData.observacoes_internas,
                                                tipo_solicitacao: editFormData.tipo_solicitacao,
                                                nome_substituido: editFormData.nome_substituido
                                            }
                                        });
                                        setIsEditModalOpen(false);
                                        setEditFormData(null);
                                    } catch (error) {
                                        console.error('Erro ao editar solicitação:', error);
                                    }
                                }}
                                disabled={isUpdating}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Salvar Alterações
                                    </>
                                )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            )}
        </div>
    );
};

export default JobRequestsManagement;

