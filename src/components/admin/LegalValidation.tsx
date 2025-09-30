import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Candidate } from '@/hooks/useCandidates';
import { useAuth } from '@/hooks/useAuth';
import {
    Loader2, ThumbsUp, ThumbsDown, UserCheck, AlertTriangle, MapPin, Briefcase, Clock, User,
    Phone, Mail, Car, Calendar, Building, FileText, ChevronDown, ChevronUp, Shield, CheckCircle, XCircle, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLegalData, useReviewLegalData, useMyApprovedValidations, useCandidatesForLegalValidation, ExtendedCandidate } from '@/hooks/useLegalData';
import { useRHProfile } from '@/hooks/useRH';
import { useUpdateCandidateStatus } from '@/hooks/useCandidates';
import { maskCPF, maskRG } from '@/utils/legal-validation';
import { format, isValid, parseISO } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApprovedLegalValidations from './ApprovedLegalValidations';

type LegalStatus = 'aprovado' | 'reprovado' | 'aprovado_com_restricao';

// Função helper para formatação segura de datas
const safeFormatDate = (dateString: string | null | undefined, formatString: string = 'dd/MM/yyyy'): string => {
    if (!dateString) return 'Não informado';

    try {
        const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
        if (!isValid(date)) return 'Data inválida';
        return format(date, formatString);
    } catch (error) {
        console.warn('Erro ao formatar data:', dateString, error);
        return 'Data inválida';
    }
};


const CandidateCard = ({ candidate, onAction }: { candidate: ExtendedCandidate; onAction: (candidate: ExtendedCandidate, action: LegalStatus) => void }) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const { data: legalData, isLoading: isLoadingLegal } = useLegalData(candidate.id);
    const reviewLegalData = useReviewLegalData();
    const { toast } = useToast();
    const { user } = useAuth();
    const { data: rhProfile } = useRHProfile(user?.id);

    const legalDataStatus = legalData?.review_status || 'not_collected';

    const handleLegalReview = async (status: 'approved' | 'rejected' | 'request_changes', notes?: string) => {
        try {
            await reviewLegalData.mutateAsync({ candidateId: candidate.id, status, notes });
            toast({
                title: 'Dados revisados com sucesso!',
                description: `Os dados jurídicos foram ${status === 'approved' ? 'aprovados' : 'rejeitados'}.`
            });
        } catch (error) {
            toast({
                title: 'Erro ao revisar dados',
                description: 'Não foi possível salvar a revisão dos dados jurídicos.',
                variant: 'destructive'
            });
        }
    };

    const openDetailsModal = () => {
        setIsDetailsOpen(true);
    };

    return (
        <>
            <Card className="w-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <CardTitle className="text-xl mb-2 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                {candidate.name}
                            </CardTitle>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Briefcase className="w-4 h-4" />
                                    <span>{candidate.job?.title || 'Vaga não especificada'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin className="w-4 h-4" />
                                    <span>{candidate.job?.city} - {candidate.job?.state}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Building className="w-4 h-4" />
                                    <span>{candidate.job?.department}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                            <Badge variant={
                                legalData?.review_status === 'approved' ? 'default' :
                                    legalData?.review_status === 'pending' ? 'secondary' :
                                        'destructive'
                            }>
                                {legalData?.review_status === 'approved' ? 'Dados Aprovados' :
                                    legalData?.review_status === 'pending' ? 'Aguardando Revisão' :
                                        'Dados Pendentes'}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex gap-2 mb-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={openDetailsModal}
                            className="flex-1"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Ver Detalhes Completos
                        </Button>
                    </div>

                    {legalData?.review_status !== 'approved' && (
                        <Alert className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Atenção:</strong> Revise dados do candidato antes de aprovar.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={() => onAction(candidate, 'aprovado')}
                            disabled={legalData?.review_status !== 'approved'}
                            className="bg-green-600 hover:bg-green-700 flex-1"
                        >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Aprovar Candidato
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => onAction(candidate, 'aprovado_com_restricao')}
                            disabled={legalData?.review_status !== 'approved'}
                            className="bg-yellow-600 hover:bg-yellow-700 flex-1"
                        >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Aprovar com Restrições
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAction(candidate, 'reprovado')}
                            className="text-red-600 border-red-200 hover:bg-red-50 flex-1"
                        >
                            <ThumbsDown className="w-4 h-4 mr-1" />
                            Reprovar Candidato
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Modal de Detalhes */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Detalhes do Candidato - {candidate.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Informações da Vaga */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                Informações da Vaga
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="font-medium">Cargo:</span> {candidate.job?.title}</div>
                                <div><span className="font-medium">Departamento:</span> {candidate.job?.department}</div>
                                <div><span className="font-medium">Local:</span> {candidate.job?.city} - {candidate.job?.state}</div>
                                <div><span className="font-medium">Tipo:</span> {candidate.job?.type}</div>
                                <div><span className="font-medium">Carga Horária:</span> {candidate.job?.workload}</div>
                            </div>
                        </div>

                        {/* Dados Jurídicos */}
                        {isLoadingLegal ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin" />
                            </div>
                        ) : legalData ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Validação de candidato
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                                    {/* Dados Pessoais */}
                                    <div className="space-y-3">
                                        <h5 className="font-medium text-blue-800 uppercase text-xs border-b border-blue-200 pb-1">
                                            Dados Pessoais
                                        </h5>
                                        <div><span className="font-medium">Nome Completo:</span> {legalData.full_name}</div>
                                        <div><span className="font-medium">CPF:</span> {rhProfile?.role === 'juridico' ? legalData.cpf : maskCPF(legalData.cpf)}</div>
                                        <div><span className="font-medium">RG:</span> {rhProfile?.role === 'juridico' ? legalData.rg : maskRG(legalData.rg)}</div>
                                        <div><span className="font-medium">Data de Nascimento:</span> {safeFormatDate(legalData.birth_date)}</div>
                                        <div><span className="font-medium">Naturalidade:</span> {legalData.birth_city}/{legalData.birth_state}</div>
                                    </div>

                                    {/* Filiação */}
                                    <div className="space-y-3">
                                        <h5 className="font-medium text-blue-800 uppercase text-xs border-b border-blue-200 pb-1">
                                            Filiação
                                        </h5>
                                        <div><span className="font-medium">Nome da Mãe:</span> {legalData.mother_name}</div>
                                        <div><span className="font-medium">Nome do Pai:</span> {legalData.father_name || 'Não informado'}</div>
                                    </div>

                                    {/* Informações Adicionais */}
                                    <div className="space-y-3">
                                        <h5 className="font-medium text-blue-800 uppercase text-xs border-b border-blue-200 pb-1">
                                            Informações Adicionais
                                        </h5>
                                        <div><span className="font-medium">Função Pretendida:</span> {legalData.desired_position}</div>
                                        <div><span className="font-medium">Ex-colaborador CGB:</span> {legalData.is_former_employee ? 'Sim' : 'Não'}</div>
                                        <div><span className="font-medium">Pessoa com Deficiência:</span> {legalData.is_pcd ? 'Sim' : 'Não'}</div>
                                        {legalData.cnh && (
                                            <div><span className="font-medium">CNH:</span> {legalData.cnh}</div>
                                        )}
                                        {legalData.responsible_name && (
                                            <div><span className="font-medium">Responsável:</span> {legalData.responsible_name}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Histórico Profissional */}
                                {legalData.work_history && legalData.work_history.length > 0 && (
                                    <div className="mt-6 space-y-3">
                                        <h5 className="font-medium text-blue-800 uppercase text-xs border-b border-blue-200 pb-1">
                                            Histórico Profissional
                                        </h5>
                                        <div className="grid gap-3">
                                            {legalData.work_history.map((work, index) => (
                                                <div key={index} className="bg-white rounded-lg p-3 border border-blue-100">
                                                    <div className="font-medium text-gray-900">{work.position}</div>
                                                    <div className="text-gray-600">{work.company}</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {safeFormatDate(work.start_date, 'MM/yyyy')} -
                                                        {work.is_current ? ' Atual' : ` ${safeFormatDate(work.end_date, 'MM/yyyy')}`}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Ações de Revisão dos Dados */}
                                {legalData.review_status === 'pending' && (
                                    <div className="mt-6 pt-4 border-t border-blue-200">
                                        <h5 className="font-medium text-blue-800 mb-3">Revisão de Dados de Candidatos</h5>
                                        <div className="flex gap-3">
                                            <Button
                                                size="sm"
                                                onClick={() => handleLegalReview('approved')}
                                                className="bg-green-600 hover:bg-green-700"
                                                disabled={reviewLegalData.isPending}
                                            >
                                                {reviewLegalData.isPending ? (
                                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                )}
                                                Aprovar Dados
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    const notes = prompt('Motivo da rejeição dos dados:');
                                                    if (notes) handleLegalReview('rejected', notes);
                                                }}
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                disabled={reviewLegalData.isPending}
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Rejeitar Dados
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {legalData.review_status === 'approved' && (
                                    <div className="mt-6 pt-4 border-t border-blue-200">
                                        <div className="flex items-center gap-2 text-green-700">
                                            <CheckCircle className="w-4 h-4" />
                                            <span className="font-medium">Dados jurídicos aprovados</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-yellow-800">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="font-medium">Dados jurídicos não coletados</span>
                                </div>
                                <p className="text-yellow-700 text-sm mt-2">
                                    Os dados jurídicos ainda não foram coletados para este candidato.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

const LegalValidation = () => {
    const { data: candidates, isLoading, error } = useCandidatesForLegalValidation();
    const updateCandidateStatus = useUpdateCandidateStatus();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [selectedCandidate, setSelectedCandidate] = useState<ExtendedCandidate | null>(null);

    // Log de debug para investigar problemas
    console.log('🔍 [LegalValidation] Estado:', {
        candidates: candidates?.length,
        isLoading,
        error: error?.message
    });
    const [action, setAction] = useState<LegalStatus | null>(null);
    const [comments, setComments] = useState('');

    const handleActionClick = (candidate: ExtendedCandidate, newAction: LegalStatus) => {
        setSelectedCandidate(candidate);
        setAction(newAction);
        setComments('');
    };

    const handleConfirm = async () => {
        if (!selectedCandidate || !action) return;

        // Validação de campos obrigatórios removida - campo de restrições agora é opcional

        // Definir o próximo status baseado na ação
        let newStatus: string;
        let successMessage: string;

        switch (action) {
            case 'aprovado':
                newStatus = 'Validação Frota';
                successMessage = 'Candidato aprovado com sucesso!';
                break;
            case 'aprovado_com_restricao':
                // CORREÇÃO: Candidato fica desbloqueado para RH decidir
                newStatus = 'Validação Frota';
                successMessage = 'Candidato aprovado com restrições! RH pode revisar.';
                break;
            case 'reprovado':
                newStatus = 'Reprovado';
                successMessage = 'Candidato reprovado.';
                break;
            default:
                return;
        }

        // Preparar dados para atualização
        // Atualizar status do candidato com comentário
        const updateData = {
            id: selectedCandidate.id,
            status: newStatus as any,
            legal_validation_comment: comments.trim() || null
        };

        updateCandidateStatus.mutate(updateData, {
            onSuccess: async () => {
                // Atualizar também os dados jurídicos para manter consistência
                if (comments.trim()) {
                    try {
                        await supabase
                            .from('candidate_legal_data')
                            .update({
                                review_status: action === 'aprovado' ? 'approved' : action === 'reprovado' ? 'rejected' : 'approved_with_restrictions',
                                review_notes: comments.trim(),
                                reviewed_at: new Date().toISOString()
                            })
                            .eq('candidate_id', selectedCandidate.id);
                    } catch (error) {
                        console.warn('Erro ao salvar comentários nos dados jurídicos:', error);
                    }
                }

                toast({
                    title: 'Validação realizada!',
                    description: successMessage,
                    variant: action === 'reprovado' ? 'destructive' : 'default'
                });
                setSelectedCandidate(null);
                setAction(null);
                setComments('');
                queryClient.invalidateQueries({ queryKey: ['candidatesForLegalValidation'] });
            },
            onError: (error: any) => {
                toast({
                    title: 'Erro ao salvar validação',
                    description: error.message || 'Tente novamente mais tarde.',
                    variant: 'destructive'
                });
            }
        });
    };

    // Tratamento de erro
    if (error) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Alert className="max-w-md mx-auto">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Erro ao carregar candidatos: {error.message}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">Pendentes <Badge className="ml-2">{candidates?.length || 0}</Badge></TabsTrigger>
                <TabsTrigger value="history">Meu Histórico</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Validação de candidato</CardTitle>
                        <CardDescription>Aprove ou reprove os candidatos na etapa de Validação TJ.</CardDescription>
                    </CardHeader>
                </Card>
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="ml-2">Carregando candidatos...</span>
                    </div>
                ) : (
                    <div className="space-y-4 mt-4">
                        {candidates && candidates.length > 0 ? candidates.map(c => (
                            <CandidateCard key={c.id} candidate={c} onAction={handleActionClick} />
                        )) : (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <p className="text-gray-500">Nenhum candidato aguardando validação.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </TabsContent>
            <TabsContent value="history" className="mt-6">
                <ApprovedLegalValidations />
            </TabsContent>
            <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {action === 'aprovado' && <CheckCircle className="w-5 h-5 text-green-600" />}
                            {action === 'aprovado_com_restricao' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                            {action === 'reprovado' && <XCircle className="w-5 h-5 text-red-600" />}
                            Confirmar Validação
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-gray-600" />
                                <span className="font-medium">{selectedCandidate?.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Briefcase className="w-4 h-4" />
                                <span>{selectedCandidate?.job?.title}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {action === 'aprovado' && (
                                <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="font-medium">Aprovar candidato para a próxima etapa</span>
                                </div>
                            )}
                            {action === 'aprovado_com_restricao' && (
                                <div className="flex items-center gap-2 text-yellow-700">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="font-medium">Aprovar candidato com restrições</span>
                                </div>
                            )}
                            {action === 'reprovado' && (
                                <div className="flex items-center gap-2 text-red-700">
                                    <XCircle className="w-4 h-4" />
                                    <span className="font-medium">Reprovar candidato</span>
                                </div>
                            )}
                        </div>

                        {(action === 'aprovado_com_restricao') && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Restrições e Observações:
                                </label>
                                <Textarea
                                    placeholder={"Descreva as restrições ou condições para aprovação..."}
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={4}
                                    className="resize-none"
                                />
                                <p className="text-xs text-gray-500">
                                    Ex: Aprovado condicionado à apresentação de documentos adicionais, treinamento específico, etc.
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedCandidate(null)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={updateCandidateStatus.isPending}
                            className={
                                action === 'aprovado' ? 'bg-green-600 hover:bg-green-700' :
                                    action === 'aprovado_com_restricao' ? 'bg-yellow-600 hover:bg-yellow-700' :
                                        'bg-red-600 hover:bg-red-700'
                            }
                        >
                            {updateCandidateStatus.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <>
                                    {action === 'aprovado' && <CheckCircle className="w-4 h-4 mr-2" />}
                                    {action === 'aprovado_com_restricao' && <AlertTriangle className="w-4 h-4 mr-2" />}
                                    {action === 'reprovado' && <XCircle className="w-4 h-4 mr-2" />}
                                </>
                            )}
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Tabs>
    );
};

export default LegalValidation; 