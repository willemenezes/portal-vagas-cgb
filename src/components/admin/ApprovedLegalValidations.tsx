import React from 'react';
import { useMyApprovedValidations } from '@/hooks/useLegalData';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle, User, Briefcase, MapPin, Calendar, XCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';

const ApprovedLegalValidations = () => {
    const { data: approvals, isLoading, error } = useMyApprovedValidations();

    const getStatusInfo = (status, hasRestriction = false) => {
        switch (status) {
            case 'approved':
                if (hasRestriction) {
                    return { 
                        text: 'Aprovado com Restrição', 
                        variant: 'outline', 
                        icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
                        className: 'bg-yellow-50 text-yellow-800 border-yellow-300'
                    };
                }
                return { text: 'Aprovado', variant: 'default', icon: <CheckCircle className="w-4 h-4 text-green-500" /> };
            case 'rejected':
                return { text: 'Rejeitado', variant: 'destructive', icon: <XCircle className="w-4 h-4 text-red-500" /> };
            case 'request_changes':
                return { text: 'Correções Solicitadas', variant: 'secondary', icon: <AlertTriangle className="w-4 h-4 text-yellow-500" /> };
            default:
                return { text: status, variant: 'outline', icon: null };
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Carregando histórico...</span>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 p-4">Erro ao carregar o histórico de validações.</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-gray-700" />
                    Meu Histórico de Validações
                </CardTitle>
                <CardDescription>
                    Lista de todas as validações jurídicas que você realizou, ordenadas da mais recente para a mais antiga.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[25%]"><User className="inline-block w-4 h-4 mr-1" />Candidato</TableHead>
                                <TableHead className="w-[25%]"><Briefcase className="inline-block w-4 h-4 mr-1" />Vaga</TableHead>
                                <TableHead className="w-[20%]"><MapPin className="inline-block w-4 h-4 mr-1" />Local</TableHead>
                                <TableHead className="w-[15%]"><Calendar className="inline-block w-4 h-4 mr-1" />Data</TableHead>
                                <TableHead className="w-[15%] text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {approvals && approvals.length > 0 ? (
                                approvals.map((approval) => {
                                    const hasRestriction = approval.candidate?.legal_validation_comment && approval.candidate.legal_validation_comment.trim() !== '';
                                    const statusInfo = getStatusInfo(approval.review_status, hasRestriction);
                                    
                                    // Debug log para verificar os dados
                                    console.log('🔍 [ApprovedLegalValidations] Debug:', {
                                        candidateName: approval.candidate?.name,
                                        reviewStatus: approval.review_status,
                                        legalComment: approval.candidate?.legal_validation_comment,
                                        hasRestriction,
                                        statusInfo
                                    });
                                    
                                    return (
                                        <TableRow key={approval.id}>
                                            <TableCell className="font-medium">{approval.candidate?.name || 'Candidato não encontrado'}</TableCell>
                                            <TableCell>{approval.candidate?.job?.title || 'Vaga não encontrada'}</TableCell>
                                            <TableCell>{`${approval.candidate?.job?.city || 'N/A'} - ${approval.candidate?.job?.state || 'N/A'}`}</TableCell>
                                            <TableCell>{approval.reviewed_at ? format(new Date(approval.reviewed_at), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                {hasRestriction ? (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Badge variant={statusInfo.variant} className={`flex items-center justify-center gap-1.5 cursor-help ${statusInfo.className}`}>
                                                                    {statusInfo.icon}
                                                                    <span>{statusInfo.text}</span>
                                                                </Badge>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-sm">
                                                                <p className="font-semibold mb-1">Restrições:</p>
                                                                <p className="text-sm">{approval.candidate?.legal_validation_comment}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ) : (
                                                    <Badge variant={statusInfo.variant} className="flex items-center justify-center gap-1.5">
                                                        {statusInfo.icon}
                                                        <span>{statusInfo.text}</span>
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-32">
                                        Você ainda não realizou nenhuma validação.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default ApprovedLegalValidations; 