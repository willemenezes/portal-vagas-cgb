import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useRHProfile } from "@/hooks/useRH";
import useJobRequests from "@/hooks/useJobRequests";
import { supabase } from "@/integrations/supabase/client";
import {
    CheckCircle,
    XCircle,
    Eye,
    MessageSquare,
    Briefcase,
    MapPin,
    Building,
    Clock,
    User,
    Loader2,
    Trash2,
    Search,
    Filter,
    Calendar,
    FileText
} from "lucide-react";

export default function JobRequestApproval() {
    const { user } = useAuth();
    const { data: rhProfile } = useRHProfile(user?.id);
    const {
        jobRequests,
        stats,
        isLoading,
        updateJobRequestStatus,
        createJobFromRequest,
        approveAndCreateJob,
        deleteJobRequest,
        isUpdating,
        isDeleting
    } = useJobRequests();

    // Estado para mapear IDs de aprovadores para nomes
    const [approverNames, setApproverNames] = useState<Record<string, string>>({});

    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [notes, setNotes] = useState("");
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState<any>(null);
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

    // Estados para filtros das solicitações processadas
    const [searchTerm, setSearchTerm] = useState("");
    const [stateFilter, setStateFilter] = useState("all");
    const [approverFilter, setApproverFilter] = useState("all");

    // Buscar nomes dos aprovadores quando as solicitações carregarem
    useEffect(() => {
        const fetchApproverNames = async () => {
            if (!jobRequests || jobRequests.length === 0) return;

            const approverIds = jobRequests
                .filter(req => req.approved_by && req.approved_by.length === 36 && req.approved_by.includes('-'))
                .map(req => req.approved_by)
                .filter((id, index, self) => self.indexOf(id) === index); // IDs únicos

            if (approverIds.length === 0) return;

            try {
                const { data: rhUsers, error } = await supabase
                    .from('rh_users')
                    .select('user_id, full_name')
                    .in('user_id', approverIds);

                if (error) {
                    console.error('Erro ao buscar nomes dos aprovadores:', error);
                    return;
                }

                const nameMap: Record<string, string> = {};
                rhUsers?.forEach(user => {
                    nameMap[user.user_id] = user.full_name || 'Aprovador';
                });

                setApproverNames(nameMap);
            } catch (error) {
                console.error('Erro ao buscar aprovadores:', error);
            }
        };

        fetchApproverNames();
    }, [jobRequests]);

    const handleApprove = async (requestId: string) => {
        try {
            await updateJobRequestStatus.mutateAsync({
                id: requestId,
                status: 'aprovado',
                notes: notes || undefined
            });
            setNotes("");
        } catch (error) {
            // Erro já tratado no hook
        }
    };

    const handleReject = async (requestId: string) => {
        if (!notes.trim()) {
            alert("Por favor, adicione uma justificativa para a rejeição.");
            return;
        }

        try {
            await updateJobRequestStatus.mutateAsync({
                id: requestId,
                status: 'rejeitado',
                notes
            });
            setNotes("");
        } catch (error) {
            // Erro já tratado no hook
        }
    };

    const handleCreateJob = async (requestId: string) => {
        try {
            await createJobFromRequest.mutateAsync(requestId);
        } catch (error) {
            // Erro já tratado no hook
        }
    };

    const handleApproveAndCreateJob = async (requestId: string) => {
        try {
            await approveAndCreateJob.mutateAsync({
                requestId,
                notes: notes || undefined
            });
            setNotes("");
        } catch (error) {
            // Erro já tratado no hook
        }
    };

    const handleDeleteRequest = (request: any) => {
        setRequestToDelete(request);
    };

    const handleConfirmDelete = async () => {
        if (!requestToDelete) return;

        try {
            await deleteJobRequest.mutateAsync(requestToDelete.id);
            setRequestToDelete(null);
        } catch (error) {
            // Erro já tratado no hook
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'aprovado':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'rejeitado':
                return <XCircle className="w-4 h-4 text-red-600" />;
            default:
                return <Clock className="w-4 h-4 text-yellow-600" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            'pendente': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'aprovado': 'bg-green-100 text-green-800 border-green-300',
            'rejeitado': 'bg-red-100 text-red-800 border-red-300'
        };

        return (
            <Badge className={variants[status] || variants.pendente}>
                {getStatusIcon(status)}
                <span className="ml-1 capitalize">{status}</span>
            </Badge>
        );
    };

    const pendingRequests = jobRequests.filter(req => req.status === 'pendente');
    const approvedRequests = jobRequests.filter(req => req.status === 'aprovado');
    const rejectedRequests = jobRequests.filter(req => req.status === 'rejeitado');
    const allProcessedRequests = jobRequests.filter(req => req.status !== 'pendente');

    // Filtrar solicitações aprovadas
    const filteredApprovedRequests = approvedRequests.filter(request => {
        const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (request.requested_by_name && request.requested_by_name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesState = stateFilter === "all" || request.state === stateFilter;
        const matchesApprover = approverFilter === "all" ||
            (request.approved_by && getApproverDisplayName(request.approved_by).toLowerCase().includes(approverFilter.toLowerCase()));

        return matchesSearch && matchesState && matchesApprover;
    });

    // Filtrar solicitações reprovadas
    const filteredRejectedRequests = rejectedRequests.filter(request => {
        const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (request.requested_by_name && request.requested_by_name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesState = stateFilter === "all" || request.state === stateFilter;
        const matchesApprover = approverFilter === "all" ||
            (request.approved_by && getApproverDisplayName(request.approved_by).toLowerCase().includes(approverFilter.toLowerCase()));

        return matchesSearch && matchesState && matchesApprover;
    });

    // Função para converter ID de aprovador em nome legível
    const getApproverDisplayName = (approvedBy: string) => {
        if (!approvedBy) return 'Aprovador';

        // Se é um UUID (36 caracteres), buscar no mapeamento dinâmico
        if (approvedBy.length === 36 && approvedBy.includes('-')) {
            return approverNames[approvedBy] || 'Carregando...';
        }

        return approvedBy;
    };

    // Criar listas únicas para filtros com nomes legíveis
    const uniqueStates = [...new Set([...approvedRequests, ...rejectedRequests].map(req => req.state))].sort();
    const uniqueApprovers = [...new Set([...approvedRequests, ...rejectedRequests]
        .filter(req => req.approved_by)
        .map(req => getApproverDisplayName(req.approved_by)))].sort();

    // Função para controlar abertura do popover
    const handlePopoverChange = (requestId: string, section: string, open: boolean) => {
        const popoverId = `${section}-${requestId}`;
        setOpenPopoverId(open ? popoverId : null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cgb-primary" />
                <span className="ml-2 text-gray-600">Carregando solicitações...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Aprovação de Solicitações</h2>
                    <div className="space-y-1">
                        <p className="text-gray-600">Analise e aprove solicitações de novas vagas</p>
                        {rhProfile && !rhProfile.is_admin && (
                            <div className="space-y-1">
                                {(rhProfile.assigned_states?.length || rhProfile.assigned_cities?.length) && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="w-4 h-4 text-blue-500" />
                                        <span className="text-blue-600 font-medium">
                                            Região atribuída: {
                                                rhProfile.assigned_states && rhProfile.assigned_states.length > 0
                                                    ? `Estados: ${rhProfile.assigned_states.join(', ')}`
                                                    : rhProfile.assigned_cities && rhProfile.assigned_cities.length > 0
                                                        ? `Cidades: ${rhProfile.assigned_cities.join(', ')}`
                                                        : 'Todas as regiões'
                                            }
                                        </span>
                                    </div>
                                )}
                                {rhProfile.role === 'manager' && rhProfile.assigned_departments && rhProfile.assigned_departments.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Building className="w-4 h-4 text-green-500" />
                                        <span className="text-green-600 font-medium">
                                            Departamentos: {rhProfile.assigned_departments.join(', ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Briefcase className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Pendentes</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.pendentes}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Aprovadas</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.aprovadas}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Rejeitadas</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.rejeitadas}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Solicitações Pendentes */}
            {pendingRequests.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Solicitações Pendentes</h3>
                    {pendingRequests.map((request) => (
                        <Card key={request.id} className="border-l-4 border-l-yellow-400">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="text-lg font-semibold text-gray-900">{request.title}</h4>
                                            {getStatusBadge(request.status)}
                                            {request.justification && (
                                                <Popover
                                                    open={openPopoverId === `pending-${request.id}`}
                                                    onOpenChange={(open) => handlePopoverChange(request.id, 'pending', open)}
                                                >
                                                    <PopoverTrigger asChild>
                                                        <Badge className="bg-orange-100 text-orange-800 border-orange-300 cursor-pointer hover:bg-orange-200 transition-colors">
                                                            <MessageSquare className="w-3 h-3 mr-1" />
                                                            Justificativa
                                                        </Badge>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80 p-3" side="top" align="start">
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium text-sm text-gray-900">Justificativa da Criação</h4>
                                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                                {request.justification}
                                                            </p>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                            <div className="flex items-center gap-1">
                                                <Building className="w-4 h-4" />
                                                {request.department}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {request.city}, {request.state}
                                            </div>
                                            {request.company_contract && (
                                                <div className="flex items-center gap-1">
                                                    <FileText className="w-4 h-4" />
                                                    {request.company_contract}
                                                </div>
                                            )}
                                            {request.requested_by_name && (
                                                <div className="flex items-center gap-1">
                                                    <User className="w-4 h-4" />
                                                    {request.requested_by_name}
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                                            {request.description}
                                        </p>

                                        <div className="text-xs text-gray-500">
                                            Solicitado em: {new Date(request.created_at).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setNotes("");
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    Analisar
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>{selectedRequest?.title}</DialogTitle>
                                                    <DialogDescription>
                                                        {selectedRequest?.requested_by_name ?
                                                            `Solicitação de ${selectedRequest.requested_by_name}` :
                                                            'Detalhes da solicitação'
                                                        }
                                                    </DialogDescription>
                                                </DialogHeader>

                                                {selectedRequest && (
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <Label className="text-sm font-medium">Departamento</Label>
                                                                <p className="text-sm text-gray-700">{selectedRequest.department}</p>
                                                            </div>
                                                            <div>
                                                                <Label className="text-sm font-medium">Localização</Label>
                                                                <p className="text-sm text-gray-700">{selectedRequest.city}, {selectedRequest.state}</p>
                                                            </div>
                                                            <div>
                                                                <Label className="text-sm font-medium">Tipo</Label>
                                                                <p className="text-sm text-gray-700">{selectedRequest.type}</p>
                                                            </div>
                                                            <div>
                                                                <Label className="text-sm font-medium">Carga Horária</Label>
                                                                <p className="text-sm text-gray-700">{selectedRequest.workload}</p>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <Label className="text-sm font-medium">Descrição</Label>
                                                            <p className="text-sm text-gray-700 mt-1">{selectedRequest.description}</p>
                                                        </div>

                                                        {selectedRequest.justification && (
                                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                                <Label className="text-sm font-medium text-blue-800">Justificativa da Criação</Label>
                                                                <p className="text-sm text-blue-700 mt-1">{selectedRequest.justification}</p>
                                                            </div>
                                                        )}

                                                        {/* Campos de Controle Interno */}
                                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                            <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                                                                📋 Controle Interno
                                                            </h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {selectedRequest.solicitante_nome && (
                                                                    <div>
                                                                        <Label className="text-sm font-medium text-gray-600">Nome do Solicitante</Label>
                                                                        <p className="text-sm text-gray-800 mt-1">{selectedRequest.solicitante_nome}</p>
                                                                    </div>
                                                                )}
                                                                {selectedRequest.solicitante_funcao && (
                                                                    <div>
                                                                        <Label className="text-sm font-medium text-gray-600">Gerente Responsável</Label>
                                                                        <p className="text-sm text-gray-800 mt-1">{selectedRequest.solicitante_funcao}</p>
                                                                    </div>
                                                                )}
                                                                {selectedRequest.tipo_solicitacao && (
                                                                    <div>
                                                                        <Label className="text-sm font-medium text-gray-600">Tipo de Solicitação</Label>
                                                                        <p className="text-sm text-gray-800 mt-1">
                                                                            {selectedRequest.tipo_solicitacao === 'aumento_quadro' ? 'Aumento de Quadro' : 
                                             selectedRequest.tipo_solicitacao === 'substituicao' ? 'Substituição' :
                                             selectedRequest.tipo_solicitacao === 'substituição' ? 'Substituição' :
                                             selectedRequest.tipo_solicitacao || 'Não informado'}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {selectedRequest.nome_substituido && (
                                                                    <div>
                                                                        <Label className="text-sm font-medium text-gray-600">Nome da Pessoa que Saiu</Label>
                                                                        <p className="text-sm text-gray-800 mt-1">{selectedRequest.nome_substituido}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {selectedRequest.observacoes_internas && (
                                                                <div className="mt-4">
                                                                    <Label className="text-sm font-medium text-gray-600">Observações Internas</Label>
                                                                    <p className="text-sm text-gray-800 mt-1">{selectedRequest.observacoes_internas}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {selectedRequest.requirements.length > 0 && (
                                                            <div>
                                                                <Label className="text-sm font-medium">Requisitos</Label>
                                                                <ul className="text-sm text-gray-700 mt-1 list-disc list-inside">
                                                                    {selectedRequest.requirements.map((req, index) => (
                                                                        <li key={index}>{req}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {selectedRequest.benefits.length > 0 && (
                                                            <div>
                                                                <Label className="text-sm font-medium">Benefícios</Label>
                                                                <ul className="text-sm text-gray-700 mt-1 list-disc list-inside">
                                                                    {selectedRequest.benefits.map((benefit, index) => (
                                                                        <li key={index}>{benefit}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        <div>
                                                            <Label htmlFor="notes">Observações (opcional para aprovação, obrigatório para rejeição)</Label>
                                                            <Textarea
                                                                id="notes"
                                                                value={notes}
                                                                onChange={(e) => setNotes(e.target.value)}
                                                                placeholder="Adicione observações sobre a decisão..."
                                                                rows={3}
                                                                className="mt-1"
                                                            />
                                                        </div>

                                                        <div className="flex justify-end gap-2 pt-4">
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => setIsDetailsOpen(false)}
                                                            >
                                                                Cancelar
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                onClick={() => {
                                                                    handleReject(selectedRequest.id);
                                                                    setIsDetailsOpen(false);
                                                                }}
                                                                disabled={isUpdating}
                                                            >
                                                                {isUpdating ? (
                                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                ) : (
                                                                    <XCircle className="w-4 h-4 mr-2" />
                                                                )}
                                                                Rejeitar
                                                            </Button>
                                                            <Button
                                                                className="bg-green-600 hover:bg-green-700"
                                                                onClick={() => {
                                                                    handleApprove(selectedRequest.id);
                                                                    setIsDetailsOpen(false);
                                                                }}
                                                                disabled={isUpdating}
                                                            >
                                                                {isUpdating ? (
                                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                ) : (
                                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                                )}
                                                                Aprovar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </DialogContent>
                                        </Dialog>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteRequest(request)}
                                            disabled={isDeleting}
                                        >
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Solicitações Processadas - Tabs para Aprovadas e Reprovadas */}
                <div className="space-y-4">
                <Tabs defaultValue="approved" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="approved" className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Aprovadas
                            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                                {approvedRequests.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="rejected" className="flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            Reprovadas
                            <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800">
                                {rejectedRequests.length}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    {/* Filtros */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Filter className="w-4 h-4" />
                                Filtros
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="search">Buscar</Label>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <Input
                                            id="search"
                                            placeholder="Título, cidade, departamento..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Estado</Label>
                                    <Select value={stateFilter} onValueChange={setStateFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos os estados" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os estados</SelectItem>
                                            {uniqueStates.map(state => (
                                                <SelectItem key={state} value={state}>{state}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Aprovador</Label>
                                    <Select value={approverFilter} onValueChange={setApproverFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos os aprovadores" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os aprovadores</SelectItem>
                                            {uniqueApprovers.map(approver => (
                                                <SelectItem key={approver} value={approver}>{approver}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Aba de Aprovadas */}
                    <TabsContent value="approved" className="mt-0">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vaga</TableHead>
                                        <TableHead>Localização</TableHead>
                                        <TableHead>Solicitante</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Processado em</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                        {filteredApprovedRequests.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">{request.title}</div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Building className="w-3 h-3" />
                                                        {request.department}
                                                    </div>
                                                    {request.justification && (
                                                        <Popover
                                                            open={openPopoverId === `table-${request.id}`}
                                                            onOpenChange={(open) => handlePopoverChange(request.id, 'table', open)}
                                                        >
                                                            <PopoverTrigger asChild>
                                                                <Badge className="bg-orange-100 text-orange-800 border-orange-300 cursor-pointer hover:bg-orange-200 transition-colors text-xs">
                                                                    <MessageSquare className="w-2 h-2 mr-1" />
                                                                    Justificativa
                                                                </Badge>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-80 p-3" side="top" align="start">
                                                                <div className="space-y-2">
                                                                    <h4 className="font-medium text-sm text-gray-900">Justificativa da Criação</h4>
                                                                    <p className="text-sm text-gray-700 leading-relaxed">
                                                                        {request.justification}
                                                                    </p>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <MapPin className="w-3 h-3 text-gray-400" />
                                                    {request.city}, {request.state}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <User className="w-3 h-3 text-gray-400" />
                                                    {request.requested_by_name || 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(request.status)}
                                                {request.status === 'aprovado' && request.job_created && (
                                                    <Badge className="bg-blue-100 text-blue-800 border-blue-300 ml-2">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Vaga Criada
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                                    <Calendar className="w-3 h-3" />
                                                    {request.approved_at ? new Date(request.approved_at).toLocaleDateString('pt-BR') : '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {request.status === 'aprovado' && !request.job_created && (rhProfile?.role === 'admin' || rhProfile?.is_admin) && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-cgb-primary hover:bg-cgb-primary-dark"
                                                            onClick={() => handleCreateJob(request.id)}
                                                        >
                                                            <Briefcase className="w-3 h-3 mr-1" />
                                                            Criar Vaga
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteRequest(request)}
                                                        disabled={isDeleting}
                                                    >
                                                        <Trash2 className="w-3 h-3 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                                </CardContent>
                            </Card>

                            {filteredApprovedRequests.length === 0 && approvedRequests.length > 0 && (
                                <div className="p-8 text-center">
                                    <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">Nenhuma solicitação aprovada encontrada com os filtros aplicados.</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setStateFilter("all");
                                            setApproverFilter("all");
                                        }}
                                    >
                                        Limpar Filtros
                                    </Button>
                                </div>
                            )}
                            {approvedRequests.length === 0 && (
                                <div className="p-8 text-center">
                                    <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">Nenhuma solicitação aprovada no momento.</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Aba de Reprovadas */}
                        <TabsContent value="rejected" className="mt-0">
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Vaga</TableHead>
                                                <TableHead>Localização</TableHead>
                                                <TableHead>Solicitante</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Processado em</TableHead>
                                                <TableHead className="text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredRejectedRequests.map((request) => (
                                                <TableRow key={request.id}>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className="font-medium">{request.title}</div>
                                                            <div className="text-sm text-gray-500 flex items-center gap-1">
                                                                <Building className="w-3 h-3" />
                                                                {request.department}
                                                            </div>
                                                            {request.justification && (
                                                                <Popover
                                                                    open={openPopoverId === `table-${request.id}`}
                                                                    onOpenChange={(open) => handlePopoverChange(request.id, 'table', open)}
                                                                >
                                                                    <PopoverTrigger asChild>
                                                                        <Badge className="bg-orange-100 text-orange-800 border-orange-300 cursor-pointer hover:bg-orange-200 transition-colors text-xs">
                                                                            <MessageSquare className="w-2 h-2 mr-1" />
                                                                            Justificativa
                                                                        </Badge>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-80 p-3" side="top" align="start">
                                                                        <div className="space-y-2">
                                                                            <h4 className="font-medium text-sm text-gray-900">Justificativa da Criação</h4>
                                                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                                                {request.justification}
                                                                            </p>
                                                                        </div>
                                                                    </PopoverContent>
                                                                </Popover>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <MapPin className="w-3 h-3 text-gray-400" />
                                                            {request.city}, {request.state}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <User className="w-3 h-3 text-gray-400" />
                                                            {request.requested_by_name || 'N/A'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(request.status)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                                            <Calendar className="w-3 h-3" />
                                                            {request.approved_at ? new Date(request.approved_at).toLocaleDateString('pt-BR') : '-'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteRequest(request)}
                                                                disabled={isDeleting}
                                                            >
                                                                <Trash2 className="w-3 h-3 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                        </CardContent>
                    </Card>

                            {filteredRejectedRequests.length === 0 && rejectedRequests.length > 0 && (
                                <div className="p-8 text-center">
                                    <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">Nenhuma solicitação reprovada encontrada com os filtros aplicados.</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setStateFilter("all");
                                            setApproverFilter("all");
                                        }}
                                    >
                                        Limpar Filtros
                                    </Button>
                </div>
            )}
                            {rejectedRequests.length === 0 && (
                                <div className="p-8 text-center">
                                    <XCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">Nenhuma solicitação reprovada no momento.</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

            {jobRequests.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Nenhuma solicitação encontrada
                        </h3>
                        <p className="text-gray-600">
                            Não há solicitações de vagas para revisar no momento.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Modal de Confirmação de Exclusão */}
            <AlertDialog open={!!requestToDelete} onOpenChange={() => setRequestToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Solicitação</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a solicitação
                            <span className="font-bold"> "{requestToDelete?.title}"</span> e todos os seus dados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRequestToDelete(null)}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Excluindo...
                                </>
                            ) : (
                                "Excluir"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 