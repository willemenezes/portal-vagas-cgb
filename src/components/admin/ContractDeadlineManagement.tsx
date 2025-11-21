import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle,
    Users,
    Search,
    Filter,
    RefreshCw,
    Eye,
    Edit,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useAllJobs, useUpdateJob, Job } from '@/hooks/useJobs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useRHProfile } from '@/hooks/useRH';

export const ContractDeadlineManagement: React.FC = () => {
    const { user } = useAuth();
    const { data: rhProfile } = useRHProfile(user?.id);
    const { data: allJobs = [], isLoading } = useAllJobs();
    const updateJobMutation = useUpdateJob();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        quantity: 1,
        expires_at: ''
    });

    // Paginação (cliente)
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 50;
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Filtrar apenas vagas processadas (aprovadas) - mesmo critério do relatório
    // IMPORTANTE: Incluir vagas concluídas e congeladas mesmo que não tenham approval_status === 'active'
    const processedJobs = React.useMemo(() => {
        return allJobs.filter(j => {
            // Incluir todas as vagas que foram processadas (aprovadas)
            // Isso inclui: ativas, concluídas, congeladas, etc.
            // Excluir apenas: rascunhos, pendentes de aprovação, rejeitadas
            const approval = String(j.approval_status || '').toLowerCase();
            const status = String(j.status || '').toLowerCase();
            const flowStatus = String(j.flow_status || '').toLowerCase();
            
            // Se tem flow_status de concluída ou congelada, SEMPRE incluir (mesmo sem approval_status)
            if (flowStatus === 'concluida' || flowStatus === 'congelada') {
                // Apenas verificar se não é rejeitada
                return !['rejected', 'rejeitado'].includes(approval);
            }
            
            // Para outras vagas, verificar se foi aprovada OU tem flow_status ativa
            const isApproved = ['active', 'ativo'].includes(approval);
            const hasFlowStatus = flowStatus === 'ativa';
            const isNotDraft = !['draft', 'rascunho'].includes(status) && !['draft', 'rascunho'].includes(approval);
            const isNotPending = !['pending_approval', 'aprovacao_pendente'].includes(approval);
            const isNotRejected = !['rejected', 'rejeitado'].includes(approval);
            
            return (isApproved || hasFlowStatus) && isNotDraft && isNotPending && isNotRejected;
        });
    }, [allJobs]);

    // Deduplicar Banco de Talentos (preferir ativo; senão, o mais recente)
    const normalizedTitle = (t: string | undefined) => (t || '').trim().toLowerCase();
    const talentJobs = processedJobs
        .filter(j => normalizedTitle(j.title) === 'banco de talentos')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const chosenTalent = talentJobs.find(j => j.approval_status === 'active' || j.status === 'active') || talentJobs[0];
    const jobsDeduped = chosenTalent
        ? [chosenTalent, ...processedJobs.filter(j => normalizedTitle(j.title) !== 'banco de talentos')]
        : processedJobs;

    // BUG FIX: Aplicar filtro de região para RECRUTADOR
    const jobsFilteredByRegion = React.useMemo(() => {
        if (!rhProfile || rhProfile.role !== 'recruiter') {
            return jobsDeduped;
        }

        const assignedStates = rhProfile.assigned_states || [];
        const assignedCities = rhProfile.assigned_cities || [];

        if (assignedStates.length === 0 && assignedCities.length === 0) {
            return jobsDeduped;
        }

        return jobsDeduped.filter(job => {
            const matchState = assignedStates.length === 0 || assignedStates.includes(job.state || '');
            const matchCity = assignedCities.length === 0 || assignedCities.includes(job.city || '');
            return matchState && matchCity;
        });
    }, [jobsDeduped, rhProfile]);

    // Função para calcular dias até expiração (reutilizada para consistência)
    const getDaysUntilExpiry = (expiryDate: string) => {
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Filtrar vagas por busca e status
    const filteredJobs = jobsFilteredByRegion.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.city.toLowerCase().includes(searchTerm.toLowerCase());

        // Helper para verificar se vaga está ativa (não concluída nem congelada)
        const isActive = job.flow_status !== 'concluida' && job.flow_status !== 'congelada';
        
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'expired' && isActive && job.expires_at && (() => {
                const days = getDaysUntilExpiry(job.expires_at);
                return days < 0; // Apenas se já passou (não inclui "expira hoje")
            })()) ||
            (statusFilter === 'expiring_soon' && isActive && job.expires_at && (() => {
                const days = getDaysUntilExpiry(job.expires_at);
                return days <= 3 && days >= 0; // Inclui "expira hoje" (days === 0)
            })()) ||
            (statusFilter === 'active' && job.flow_status === 'ativa') ||
            (statusFilter === 'completed' && job.flow_status === 'concluida') ||
            (statusFilter === 'congelada' && job.flow_status === 'congelada');

        return matchesSearch && matchesStatus;
    });

    // Calcular estatísticas (sobre lista filtrada por região)
    // IMPORTANTE: Vagas concluídas ou congeladas NÃO devem contar como expiradas
    // IMPORTANTE: "Expira hoje" (days === 0) NÃO deve contar como expirada
    // IMPORTANTE: Considerar o campo 'quantity' de cada vaga (ex: 3 vagas em Castanhal = quantity: 3)
    const getQuantity = (job: Job) => job.quantity || 1; // Se não tiver quantity, assume 1
    
    const stats = {
        total: jobsFilteredByRegion.reduce((sum, job) => sum + getQuantity(job), 0),
        expired: jobsFilteredByRegion.reduce((sum, job) => {
            // Só contar como expirada se:
            // 1. Tem data de expiração
            // 2. A data já passou (days < 0, não days <= 0)
            // 3. A vaga está ATIVA (não concluída nem congelada)
            const isActive = job.flow_status !== 'concluida' && job.flow_status !== 'congelada';
            if (!isActive || !job.expires_at) return sum;
            const days = getDaysUntilExpiry(job.expires_at);
            if (days < 0) { // Apenas se já passou (não inclui "expira hoje")
                return sum + getQuantity(job);
            }
            return sum;
        }, 0),
        expiring_soon: jobsFilteredByRegion.reduce((sum, job) => {
            // Só contar como "expirando em breve" se a vaga está ativa
            const isActive = job.flow_status !== 'concluida' && job.flow_status !== 'congelada';
            if (!isActive || !job.expires_at) return sum;
            const days = getDaysUntilExpiry(job.expires_at);
            if (days <= 3 && days >= 0) { // Inclui "expira hoje" (days === 0)
                return sum + getQuantity(job);
            }
            return sum;
        }, 0),
        active: jobsFilteredByRegion.reduce((sum, job) => {
            if (job.flow_status === 'ativa') {
                return sum + getQuantity(job);
            }
            return sum;
        }, 0),
        completed: jobsFilteredByRegion.reduce((sum, job) => {
            if (job.flow_status === 'concluida') {
                return sum + getQuantity(job);
            }
            return sum;
        }, 0),
        congelada: jobsFilteredByRegion.reduce((sum, job) => {
            if (job.flow_status === 'congelada') {
                return sum + getQuantity(job);
            }
            return sum;
        }, 0)
    };

    // Paginação baseada na lista filtrada
    const totalCount = filteredJobs.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startIndex = currentPage * pageSize;
    const endIndex = Math.min(totalCount, startIndex + pageSize);
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

    // Função para obter status de expiração
    const getExpiryStatus = (expiryDate: string, flowStatus?: string) => {
        // Se a vaga está concluída ou congelada, não mostrar contagem regressiva
        const normalize = (value?: string | null) => {
            if (!value) return '';
            try {
                return value
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/\p{Diacritic}/gu, '');
            } catch {
                return String(value).toLowerCase();
            }
        };

        const normalizedFlow = normalize(flowStatus);
        const isInactive = normalizedFlow === 'concluida' || normalizedFlow === 'congelada';

        if (isInactive) {
            if (normalizedFlow === 'concluida') {
                return { status: 'inactive', color: 'gray', text: 'Concluída' };
            }
            if (normalizedFlow === 'congelada') {
                return { status: 'inactive', color: 'blue', text: 'Congelada' };
            }
            return { status: 'inactive', color: 'gray', text: 'Concluída' };
        }

        const days = getDaysUntilExpiry(expiryDate);
        if (days < 0) return { status: 'expired', color: 'red', text: `Expirada há ${Math.abs(days)} dias` };
        if (days === 0) return { status: 'expiring_today', color: 'orange', text: 'Expira hoje' };
        if (days === 1) return { status: 'expiring_tomorrow', color: 'orange', text: 'Expira amanhã' };
        if (days <= 3) return { status: 'expiring_soon', color: 'yellow', text: `${days} dias restantes` };
        return { status: 'active', color: 'green', text: `${days} dias restantes` };
    };

    // Função para abrir modal de edição
    const handleEditJob = (job: any) => {
        setSelectedJob(job);
        setEditFormData({
            quantity: job.quantity || 1,
            expires_at: job.expires_at ? new Date(job.expires_at).toISOString().slice(0, 16) : ''
        });
        setIsEditModalOpen(true);
    };

    // Função para abrir modal de visualização
    const handleViewJob = (job: any) => {
        setSelectedJob(job);
        setIsViewModalOpen(true);
    };

    // Função para salvar edição
    const handleSaveEdit = async () => {
        if (!selectedJob) return;

        try {
            await updateJobMutation.mutateAsync({
                id: selectedJob.id,
                quantity: editFormData.quantity,
                expires_at: editFormData.expires_at ? new Date(editFormData.expires_at).toISOString() : null
            });

            toast({
                title: "Vaga atualizada!",
                description: "As alterações foram salvas com sucesso.",
            });

            setIsEditModalOpen(false);
            setSelectedJob(null);
        } catch (error) {
            console.error('Erro ao atualizar vaga:', error);
            toast({
                title: "Erro ao atualizar vaga",
                description: "Tente novamente mais tarde.",
                variant: "destructive",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-cgb-primary" />
                <span className="ml-2 text-gray-600">Carregando prazos de contratação...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Prazos de Contratação</h1>
                    <p className="text-gray-600">Gerencie os prazos de 20 dias para contratação das vagas</p>
                </div>
                <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                </Button>
            </div>

            {/* Filtros */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Buscar por título, departamento ou cidade..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Filtrar por status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as vagas</SelectItem>
                                    <SelectItem value="expired">Expiradas</SelectItem>
                                    <SelectItem value="expiring_soon">Expirando em breve</SelectItem>
                                    <SelectItem value="active">Ativas</SelectItem>
                                    <SelectItem value="completed">Concluídas</SelectItem>
                                    <SelectItem value="congelada">Congeladas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabela de vagas */}
            <Card>
                <CardHeader>
                    <CardTitle>Vagas e Prazos</CardTitle>
                    <CardDescription>
                        Lista de todas as vagas com seus respectivos prazos de contratação
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vaga</TableHead>
                                <TableHead>Departamento</TableHead>
                                <TableHead>Local</TableHead>
                                <TableHead>Quantidade</TableHead>
                                <TableHead>Data de Expiração</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedJobs.map((job) => {
                                const expiryInfo = job.expires_at ? getExpiryStatus(job.expires_at, job.flow_status) : null;
                                const remainingPositions = (job.quantity || 1) - (job.quantity_filled || 0);

                                return (
                                    <TableRow key={job.id}>
                                        <TableCell className="font-medium">{job.title}</TableCell>
                                        <TableCell>{job.department}</TableCell>
                                        <TableCell>{job.city}, {job.state}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm">
                                                    {remainingPositions}/{job.quantity || 1}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {job.expires_at ? (
                                                <div className="space-y-1">
                                                    <p className="text-sm">
                                                        {new Date(job.expires_at).toLocaleDateString('pt-BR')}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(job.expires_at).toLocaleTimeString('pt-BR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">Não definido</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {expiryInfo ? (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-xs",
                                                        expiryInfo.color === 'red' && "bg-red-100 text-red-700 border-red-200",
                                                        expiryInfo.color === 'orange' && "bg-orange-100 text-orange-700 border-orange-200",
                                                        expiryInfo.color === 'yellow' && "bg-yellow-100 text-yellow-700 border-yellow-200",
                                                        expiryInfo.color === 'green' && "bg-green-100 text-green-700 border-green-200",
                                                        expiryInfo.color === 'gray' && "bg-gray-100 text-gray-700 border-gray-200",
                                                        expiryInfo.color === 'blue' && "bg-blue-100 text-blue-700 border-blue-200"
                                                    )}
                                                >
                                                    {expiryInfo.text}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">
                                                    Sem prazo
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewJob(job)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {job.title !== 'Banco de Talentos' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditJob(job)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>

                    {/* Paginação */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 px-2">
                            <div className="text-sm text-gray-600">
                                Mostrando {startIndex + 1} a {endIndex} de {totalCount} vagas
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => handlePageChange(0)} disabled={currentPage === 0}>Primeira</Button>
                                <Button variant="outline" size="sm" onClick={() => handlePageChange(Math.max(0, currentPage - 1))} disabled={currentPage === 0}>
                                    <ChevronLeft className="w-4 h-4" /> Anterior
                                </Button>
                                <span className="px-3 py-1 text-sm font-medium">Página {currentPage + 1} de {totalPages}</span>
                                <Button variant="outline" size="sm" onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage >= totalPages - 1}>
                                    Próxima <ChevronRight className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages - 1)} disabled={currentPage >= totalPages - 1}>Última</Button>
                            </div>
                        </div>
                    )}

                    {filteredJobs.length === 0 && (
                        <div className="text-center py-8">
                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Nenhuma vaga encontrada com os filtros aplicados</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Visualização */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalhes da Vaga</DialogTitle>
                        <DialogDescription>
                            Informações completas sobre a vaga e seus prazos
                        </DialogDescription>
                    </DialogHeader>
                    {selectedJob && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Título</label>
                                    <p className="text-sm">{selectedJob.title}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Departamento</label>
                                    <p className="text-sm">{selectedJob.department}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Local</label>
                                    <p className="text-sm">{selectedJob.city}, {selectedJob.state}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Quantidade</label>
                                    <p className="text-sm">{selectedJob.quantity || 1} vaga(s)</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Data de Expiração</label>
                                    <p className="text-sm">
                                        {selectedJob.expires_at
                                            ? new Date(selectedJob.expires_at).toLocaleDateString('pt-BR')
                                            : 'Não definido'
                                        }
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <p className="text-sm">
                                        {selectedJob.expires_at ? getExpiryStatus(selectedJob.expires_at).text : 'Sem prazo'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de Edição */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Vaga</DialogTitle>
                        <DialogDescription>
                            Atualize a quantidade e prazo de expiração da vaga
                        </DialogDescription>
                    </DialogHeader>
                    {selectedJob && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Quantidade de Vagas</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={editFormData.quantity}
                                    onChange={(e) => setEditFormData(prev => ({
                                        ...prev,
                                        quantity: parseInt(e.target.value) || 1
                                    }))}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Data de Expiração</label>
                                <Input
                                    type="datetime-local"
                                    value={editFormData.expires_at}
                                    onChange={(e) => setEditFormData(prev => ({
                                        ...prev,
                                        expires_at: e.target.value
                                    }))}
                                    className="mt-1"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Deixe vazio para usar prazo padrão de 20 dias
                                </p>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSaveEdit}
                                    disabled={updateJobMutation.isPending}
                                >
                                    {updateJobMutation.isPending ? 'Salvando...' : 'Salvar'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ContractDeadlineManagement;
