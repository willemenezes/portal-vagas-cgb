import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Candidate } from '@/hooks/useCandidates';
import { useAuth } from '@/hooks/useAuth';
import {
    Loader2,
    ThumbsUp,
    ThumbsDown,
    UserCheck,
    AlertTriangle,
    MapPin,
    Briefcase,
    Clock,
    User,
    Phone,
    Mail,
    Car,
    Calendar,
    Building,
    FileText,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { legal_validation_status } from '@/lib/constants';

type LegalStatus = 'aprovado' | 'reprovado' | 'aprovado_com_restricao';

interface ExtendedCandidate extends Candidate {
    job?: {
        title: string;
        city: string;
        state: string;
        department: string;
        type: string;
        workload: string;
        description: string;
    };
    candidate_city?: string;
    candidate_state?: string;
    age?: string;
    pcd?: string;
    cnh?: string;
    vehicle?: string;
    vehicle_model?: string;
    vehicle_year?: string;
    worked_at_cgb?: string;
    desired_job?: string;
    applied_date?: string;
}

// Hook para buscar candidatos em validação com dados completos
const useCandidatesForLegalValidation = () => {
    return useQuery<ExtendedCandidate[], Error>({
        queryKey: ['candidatesForLegalValidation'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('candidates')
                .select(`
                    *,
                    job:jobs (
                        title,
                        city,
                        state,
                        department,
                        type,
                        workload,
                        description
                    )
                `)
                .eq('status', 'Validação TJ')
                .eq('legal_status', 'pendente');
            if (error) throw error;
            return data || [];
        }
    });
};

// Hook para atualizar a validação
const useUpdateLegalValidation = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: async ({ candidateId, status, comments }: { candidateId: string; status: LegalStatus; comments?: string }) => {
            // 1. Atualiza a tabela 'candidates'
            const { error: candidateError } = await supabase
                .from('candidates')
                .update({ legal_status: status })
                .eq('id', candidateId);
            if (candidateError) throw candidateError;

            // 2. Insere o registro na tabela de validações
            const { error: validationError } = await supabase
                .from('candidate_legal_validations')
                .insert({
                    candidate_id: candidateId,
                    validator_id: user?.id,
                    status,
                    comments,
                });
            if (validationError) throw validationError;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['candidatesForLegalValidation'] });
            queryClient.invalidateQueries({ queryKey: ['candidateHistory', variables.candidateId] });
            queryClient.invalidateQueries({ queryKey: ['candidateNotes', variables.candidateId] });
            queryClient.invalidateQueries({ queryKey: ['candidateLegalValidations', variables.candidateId] });
        },
    });
};

const CandidateCard = ({ candidate, onAction }: { candidate: ExtendedCandidate; onAction: (candidate: ExtendedCandidate, action: LegalStatus) => void }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <CardTitle className="text-xl mb-2 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            {candidate.name}
                        </CardTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {/* Informações da Vaga */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-primary font-medium">
                                    <Briefcase className="w-4 h-4" />
                                    Vaga: {candidate.job?.title || 'N/A'}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="w-4 h-4" />
                                    {candidate.job?.city || 'N/A'} - {candidate.job?.state || 'N/A'}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Building className="w-4 h-4" />
                                    {candidate.job?.department || 'N/A'}
                                </div>
                            </div>

                            {/* Informações do Candidato */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="w-4 h-4" />
                                    {candidate.email}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="w-4 h-4" />
                                    {candidate.phone}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    Aplicado em: {formatDate(candidate.applied_date)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex flex-col gap-2 ml-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAction(candidate, 'reprovado')}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                            <ThumbsDown className="w-4 h-4 mr-1" />
                            Reprovar
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAction(candidate, 'aprovado_com_restricao')}
                            className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                        >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Aprovar c/ Restrição
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => onAction(candidate, 'aprovado')}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Aprovar
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-between p-2">
                            <span>Ver detalhes completos</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 mt-4">
                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Detalhes da Vaga */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" />
                                    Detalhes da Vaga
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium">Tipo:</span>
                                        <Badge variant="secondary" className="ml-2">
                                            {candidate.job?.type || 'N/A'}
                                        </Badge>
                                    </div>
                                    <div>
                                        <span className="font-medium">Carga Horária:</span>
                                        <span className="ml-2">{candidate.job?.workload || 'N/A'}</span>
                                    </div>
                                    {candidate.job?.description && (
                                        <div>
                                            <span className="font-medium">Descrição:</span>
                                            <p className="mt-1 text-muted-foreground">{candidate.job.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Informações Pessoais */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Dados Pessoais
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium">Idade:</span>
                                        <span className="ml-2">{candidate.age || 'N/A'} anos</span>
                                    </div>
                                    <div>
                                        <span className="font-medium">PCD:</span>
                                        <Badge variant={candidate.pcd === 'Sim' ? 'default' : 'secondary'} className="ml-2">
                                            {candidate.pcd || 'N/A'}
                                        </Badge>
                                    </div>
                                    <div>
                                        <span className="font-medium">Cidade:</span>
                                        <span className="ml-2">
                                            {candidate.candidate_city || 'N/A'} - {candidate.candidate_state || 'N/A'}
                                        </span>
                                    </div>
                                    {candidate.worked_at_cgb && (
                                        <div>
                                            <span className="font-medium">Já trabalhou na CGB:</span>
                                            <Badge variant="outline" className="ml-2">
                                                {candidate.worked_at_cgb}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Informações de Transporte */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                                    <Car className="w-4 h-4" />
                                    Transporte
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium">CNH:</span>
                                        <Badge variant="secondary" className="ml-2">
                                            {candidate.cnh || 'N/A'}
                                        </Badge>
                                    </div>
                                    <div>
                                        <span className="font-medium">Veículo:</span>
                                        <span className="ml-2">{candidate.vehicle || 'N/A'}</span>
                                    </div>
                                    {candidate.vehicle_model && (
                                        <div>
                                            <span className="font-medium">Modelo:</span>
                                            <span className="ml-2">
                                                {candidate.vehicle_model} {candidate.vehicle_year ? `(${candidate.vehicle_year})` : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
};

const LegalValidation = () => {
    const { data: candidates, isLoading } = useCandidatesForLegalValidation();
    const updateValidation = useUpdateLegalValidation();
    const { toast } = useToast();

    const [selectedCandidate, setSelectedCandidate] = useState<ExtendedCandidate | null>(null);
    const [action, setAction] = useState<LegalStatus | null>(null);
    const [comments, setComments] = useState('');

    const handleActionClick = (candidate: ExtendedCandidate, newAction: LegalStatus) => {
        setSelectedCandidate(candidate);
        setAction(newAction);
        setComments('');
    };

    const handleConfirm = async () => {
        if (!selectedCandidate || !action) return;
        if (action !== 'aprovado' && !comments.trim()) {
            toast({
                title: 'Comentário obrigatório',
                description: 'Para reprovar ou aprovar com restrição, um comentário é necessário.',
                variant: 'destructive'
            });
            return;
        }

        updateValidation.mutate(
            { candidateId: selectedCandidate.id, status: action, comments },
            {
                onSuccess: () => {
                    toast({
                        title: 'Validação Salva!',
                        description: `A validação para ${selectedCandidate.name} foi registrada com sucesso.`,
                        variant: 'default'
                    });
                    setSelectedCandidate(null);
                    setAction(null);
                },
                onError: (error: any) => {
                    toast({
                        title: 'Erro ao Salvar',
                        description: error.message,
                        variant: 'destructive'
                    });
                }
            }
        );
    };

    const getActionLabel = (action: LegalStatus) => {
        switch (action) {
            case 'aprovado': return 'Aprovado';
            case 'reprovado': return 'Reprovado';
            case 'aprovado_com_restricao': return 'Aprovado com Restrição';
            default: return action;
        }
    };

    const getActionColor = (action: LegalStatus) => {
        switch (action) {
            case 'aprovado': return 'text-green-600';
            case 'reprovado': return 'text-red-600';
            case 'aprovado_com_restricao': return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Carregando candidatos...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5" />
                        Validação Legal de Candidatos
                    </CardTitle>
                    <CardDescription>
                        Aprove, reprove ou aprove com restrições os candidatos na etapa de Validação TJ.
                        Clique em "Ver detalhes completos" para visualizar todas as informações do candidato e da vaga.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="space-y-4">
                {candidates && candidates.length > 0 ? (
                    candidates.map(candidate => (
                        <CandidateCard
                            key={candidate.id}
                            candidate={candidate}
                            onAction={handleActionClick}
                        />
                    ))
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <UserCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-lg font-medium mb-2">Nenhum candidato aguardando validação</p>
                            <p className="text-muted-foreground">
                                Todos os candidatos foram validados ou não há candidatos na etapa de Validação TJ no momento.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserCheck className="w-5 h-5" />
                            Confirmar Validação
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-muted p-4 rounded-lg">
                            <p className="font-medium">{selectedCandidate?.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {selectedCandidate?.job?.title} - {selectedCandidate?.job?.city}/{selectedCandidate?.job?.state}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <span>Ação selecionada:</span>
                            <Badge className={getActionColor(action!)}>
                                {getActionLabel(action!)}
                            </Badge>
                        </div>

                        {(action === 'reprovado' || action === 'aprovado_com_restricao') && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {action === 'reprovado' ? 'Motivo da reprovação:' : 'Restrições:'}
                                </label>
                                <Textarea
                                    placeholder={action === 'reprovado'
                                        ? "Descreva o motivo da reprovação..."
                                        : "Descreva as restrições para aprovação..."
                                    }
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={4}
                                    className="resize-none"
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedCandidate(null)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={updateValidation.isPending}
                            className={action === 'aprovado' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                            {updateValidation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Salvando...
                                </>
                            ) : (
                                'Confirmar Validação'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LegalValidation; 