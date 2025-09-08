import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useJobRequests } from '@/hooks/useJobRequests';
import { 
    CheckCircle, 
    Clock, 
    MapPin, 
    Building, 
    Users, 
    Calendar,
    Briefcase,
    Eye,
    Plus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ApprovedJobRequestsProps {
    rhProfile: any;
}

const ApprovedJobRequests: React.FC<ApprovedJobRequestsProps> = ({ rhProfile }) => {
    const { toast } = useToast();
    const { 
        jobRequests, 
        createJobFromRequest, 
        approveAndCreateJob,
        isLoading 
    } = useJobRequests();

    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Filtrar apenas job requests aprovadas que ainda não foram convertidas em vagas
    const approvedRequests = jobRequests?.filter(request => 
        request.status === 'aprovado' && 
        !request.job_created // Assumindo que existe um campo para marcar se já foi criada a vaga
    ) || [];

    const handleCreateJob = async (requestId: string) => {
        try {
            await createJobFromRequest.mutateAsync(requestId);
            toast({
                title: "Vaga criada com sucesso!",
                description: "A vaga foi criada e está ativa para candidaturas."
            });
        } catch (error) {
            toast({
                title: "Erro ao criar vaga",
                description: "Não foi possível criar a vaga. Tente novamente.",
                variant: "destructive"
            });
        }
    };

    const handleApproveAndCreateJob = async (requestId: string) => {
        try {
            await approveAndCreateJob.mutateAsync({
                requestId,
                notes: "Aprovado e criado pelo RH Admin"
            });
            toast({
                title: "Vaga aprovada e criada!",
                description: "A solicitação foi aprovada e a vaga foi criada diretamente."
            });
        } catch (error) {
            toast({
                title: "Erro ao aprovar e criar vaga",
                description: "Não foi possível aprovar e criar a vaga. Tente novamente.",
                variant: "destructive"
            });
        }
    };

    const handleViewDetails = (request: any) => {
        setSelectedRequest(request);
        setIsDetailsOpen(true);
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Solicitações Aprovadas para Criação
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-40 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cgb-primary mx-auto"></div>
                        <p className="mt-2 text-gray-600">Carregando solicitações...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (approvedRequests.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Solicitações Aprovadas para Criação
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma solicitação aprovada aguardando criação de vaga.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-green-50 border-green-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    Solicitações Aprovadas para Criação
                    <Badge variant="secondary" className="ml-2">
                        {approvedRequests.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {approvedRequests.map((request) => (
                    <div key={request.id} className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-gray-900">{request.title}</h3>
                                    <Badge variant="outline" className="text-green-700 border-green-300">
                                        Aprovado
                                    </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                                    <div className="flex items-center gap-1">
                                        <Building className="w-4 h-4" />
                                        <span>{request.department}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        <span>{request.city}, {request.state}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{request.workload}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            Aprovado {formatDistanceToNow(new Date(request.approved_at), { 
                                                addSuffix: true, 
                                                locale: ptBR 
                                            })}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-sm text-gray-600 mb-3">
                                    <p className="font-medium mb-1">Aprovado por:</p>
                                    <p className="text-gray-500">{request.approved_by}</p>
                                    {request.notes && (
                                        <>
                                            <p className="font-medium mb-1 mt-2">Observações:</p>
                                            <p className="text-gray-500">{request.notes}</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 ml-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDetails(request)}
                                    className="flex items-center gap-1"
                                >
                                    <Eye className="w-4 h-4" />
                                    Ver Detalhes
                                </Button>
                                
                                <Button
                                    size="sm"
                                    onClick={() => handleCreateJob(request.id)}
                                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                                    disabled={createJobFromRequest.isPending}
                                >
                                    <Plus className="w-4 h-4" />
                                    Criar Vaga
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default ApprovedJobRequests;
