import React, { useMemo, useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

const ApprovedLegalValidations = () => {
    const { data: approvals, isLoading, error } = useMyApprovedValidations();
    const [activeTab, setActiveTab] = useState<'approved' | 'approved_with_restrictions' | 'rejected'>('approved');

    // Filtrar aprovações por status
    const filteredApprovals = useMemo(() => {
        if (!approvals) return [];
        
        return approvals.filter(approval => {
            if (activeTab === 'approved') {
                // Apenas aprovados SEM restrições
                return approval.review_status === 'approved' && 
                       (!approval.candidate?.legal_validation_comment || approval.candidate.legal_validation_comment.trim() === '');
            } else if (activeTab === 'approved_with_restrictions') {
                // Aprovados COM restrições (approved_with_restrictions OU approved com comentário)
                return approval.review_status === 'approved_with_restrictions' || 
                       (approval.review_status === 'approved' && 
                        approval.candidate?.legal_validation_comment && 
                        approval.candidate.legal_validation_comment.trim() !== '');
            } else if (activeTab === 'rejected') {
                // Reprovados
                return approval.review_status === 'rejected';
            }
            return false;
        });
    }, [approvals, activeTab]);

    // Contar por categoria
    const counts = useMemo(() => {
        if (!approvals) return { approved: 0, withRestrictions: 0, rejected: 0 };
        
        const approved = approvals.filter(a => 
            a.review_status === 'approved' && 
            (!a.candidate?.legal_validation_comment || a.candidate.legal_validation_comment.trim() === '')
        ).length;
        
        const withRestrictions = approvals.filter(a => 
            a.review_status === 'approved_with_restrictions' || 
            (a.review_status === 'approved' && a.candidate?.legal_validation_comment && a.candidate.legal_validation_comment.trim() !== '')
        ).length;
        
        const rejected = approvals.filter(a => a.review_status === 'rejected').length;
        
        return { approved, withRestrictions, rejected };
    }, [approvals]);

    const getStatusInfo = (status: string, hasRestriction = false) => {
        switch (status) {
            case 'approved':
                if (hasRestriction || status === 'approved_with_restrictions') {
                    return { 
                        text: 'Aprovado com Restrição', 
                        variant: 'outline' as const, 
                        icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
                        className: 'bg-yellow-50 text-yellow-800 border-yellow-300'
                    };
                }
                return { text: 'Aprovado', variant: 'default' as const, icon: <CheckCircle className="w-4 h-4 text-green-500" /> };
            case 'approved_with_restrictions':
                return { 
                    text: 'Aprovado com Restrição', 
                    variant: 'outline' as const, 
                    icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
                    className: 'bg-yellow-50 text-yellow-800 border-yellow-300'
                };
            case 'rejected':
                return { text: 'Rejeitado', variant: 'destructive' as const, icon: <XCircle className="w-4 h-4 text-red-500" /> };
            case 'request_changes':
                return { text: 'Correções Solicitadas', variant: 'secondary' as const, icon: <AlertTriangle className="w-4 h-4 text-yellow-500" /> };
            default:
                return { text: status, variant: 'outline' as const, icon: null };
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

    const renderTable = (approvalsToShow: typeof approvals) => {
        return (
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
                        {approvalsToShow && approvalsToShow.length > 0 ? (
                            approvalsToShow.map((approval) => {
                                const hasRestriction = approval.review_status === 'approved_with_restrictions' || 
                                                     (approval.candidate?.legal_validation_comment && approval.candidate.legal_validation_comment.trim() !== '');
                                const statusInfo = getStatusInfo(approval.review_status, hasRestriction);
                                
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
                                                            <p className="text-sm">{approval.candidate?.legal_validation_comment || approval.review_notes}</p>
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
                                    Nenhuma validação encontrada nesta categoria.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-gray-700" />
                    Meu Histórico de Validações
                </CardTitle>
                <CardDescription>
                    Histórico organizado por categoria das validações jurídicas que você realizou.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="approved">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Aprovados
                            {counts.approved > 0 && <Badge className="ml-2">{counts.approved}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="approved_with_restrictions">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Aprovados com Restrição
                            {counts.withRestrictions > 0 && <Badge className="ml-2">{counts.withRestrictions}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="rejected">
                            <XCircle className="w-4 h-4 mr-2" />
                            Reprovados
                            {counts.rejected > 0 && <Badge className="ml-2">{counts.rejected}</Badge>}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="approved" className="mt-4">
                        {renderTable(filteredApprovals)}
                    </TabsContent>

                    <TabsContent value="approved_with_restrictions" className="mt-4">
                        {renderTable(filteredApprovals)}
                    </TabsContent>

                    <TabsContent value="rejected" className="mt-4">
                        {renderTable(filteredApprovals)}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default ApprovedLegalValidations; 