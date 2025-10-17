import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Loader2, FileText, Calendar, MapPin, Users, ChevronLeft, ChevronRight, CheckCircle, Clock, Eye, Edit, Trash2, Download, User, UserCheck } from 'lucide-react';
import { Job, useUpdateJob, useAllJobs, useDeleteJob } from '@/hooks/useJobs';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

const JobRequestsManagement = () => {
    const { toast } = useToast();
    const { data: allJobs = [], isLoading } = useAllJobs();
    const updateJob = useUpdateJob();
    const deleteJob = useDeleteJob();

    const [activeView, setActiveView] = useState<'pending' | 'approved'>('pending');
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isRejectModalOpen, setRejectModalOpen] = useState(false);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [userNames, setUserNames] = useState<Record<string, string>>({});

    // Paginação para vagas pendentes
    const [pendingPage, setPendingPage] = useState(0);
    const pendingPageSize = 10;

    // Paginação para vagas aprovadas
    const [approvedPage, setApprovedPage] = useState(0);
    const approvedPageSize = 10;

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
            const { data: users, error } = await supabase
                .from('rh_users')
                .select('user_id, name')
                .in('user_id', Array.from(userIds));

            if (error) {
                console.warn('Erro ao buscar nomes de usuários:', error);
                return;
            }

            // Criar mapa de IDs para nomes
            const nameMap: Record<string, string> = {};
            users?.forEach(user => {
                nameMap[user.user_id] = user.name;
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

    const handleApproval = async (jobId: string) => {
        try {
            await updateJob.mutateAsync({
                id: jobId,
                approval_status: 'active',
                status: 'active',
                flow_status: 'ativa'
            });
            toast({
                title: '✅ Vaga Aprovada!',
                description: 'A vaga agora está ativa e pública no portal.'
            });
        } catch (error) {
            toast({
                title: '❌ Erro',
                description: 'Não foi possível aprovar a vaga.',
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

    // Filtrar vagas pendentes (criadas por solicitadores ou recrutadores aguardando aprovação)
    const pendingJobs = allJobs.filter(job =>
        job.approval_status === 'pending_approval' ||
        job.approval_status === 'pending'
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Filtrar vagas aprovadas/publicadas (incluindo todas as ativas e concluídas)
    const approvedJobs = allJobs.filter(job =>
        job.approval_status === 'active' ||
        job.approval_status === 'ativo' ||
        job.status === 'active' ||
        job.status === 'ativo' ||
        job.status === 'concluded' ||
        job.flow_status === 'concluida'
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Paginação para vagas pendentes
    const totalPendingJobs = pendingJobs.length;
    const totalPendingPages = Math.max(1, Math.ceil(totalPendingJobs / pendingPageSize));
    const pendingStartIndex = pendingPage * pendingPageSize;
    const pendingEndIndex = Math.min(totalPendingJobs, pendingStartIndex + pendingPageSize);
    const paginatedPendingJobs = pendingJobs.slice(pendingStartIndex, pendingEndIndex);

    // Paginação para vagas aprovadas
    const totalApprovedJobs = approvedJobs.length;
    const totalApprovedPages = Math.max(1, Math.ceil(totalApprovedJobs / approvedPageSize));
    const approvedStartIndex = approvedPage * approvedPageSize;
    const approvedEndIndex = Math.min(totalApprovedJobs, approvedStartIndex + approvedPageSize);
    const paginatedApprovedJobs = approvedJobs.slice(approvedStartIndex, approvedEndIndex);

    const handlePendingPageChange = (newPage: number) => {
        setPendingPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleApprovedPageChange = (newPage: number) => {
        setApprovedPage(newPage);
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

    if (isLoading) {
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

            {/* Toggle entre Pendentes e Aprovadas */}
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
            </div>

            {/* Conteúdo */}
            {activeView === 'pending' ? (
                <Card className="bg-amber-50 border-amber-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-900">
                            <Clock className="w-6 h-6" />
                            Solicitações Aprovadas para Criação
                            <Badge className="bg-amber-600 ml-auto">{totalPendingJobs} pendente{totalPendingJobs !== 1 ? 's' : ''}</Badge>
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
                                                        disabled={updateJob.isPending}
                                                    >
                                                        <Check className="w-4 h-4 mr-1" /> Publicar Vaga
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
                                            Mostrando {pendingStartIndex + 1} a {pendingEndIndex} de {totalPendingJobs} solicitações
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
            ) : (
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
        </div>
    );
};

export default JobRequestsManagement;

