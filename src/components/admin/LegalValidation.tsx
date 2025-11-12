import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Candidate } from '@/hooks/useCandidates';
import { useAuth } from '@/hooks/useAuth';
import {
    Loader2, ThumbsUp, ThumbsDown, UserCheck, AlertTriangle, MapPin, Briefcase, Clock, User,
    Phone, Mail, Car, Calendar, Building, FileText, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Shield, CheckCircle, XCircle, Info, Filter
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
import { maskCPF, maskRG, calculateBusinessDaysElapsed } from '@/utils/legal-validation';
import { format, isValid, parseISO } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

// Função helper para calcular tempo decorrido e status do prazo (48h = 2 dias úteis)
// Agora usa cálculo de dias úteis com regra das 16h
const getTimeElapsed = (startDate: string | null | undefined): { text: string; isOverdue: boolean; hours: number } => {
    const result = calculateBusinessDaysElapsed(startDate);
    // Manter compatibilidade com a interface antiga (hours será 0 para dias úteis)
    return {
        text: result.text,
        isOverdue: result.isOverdue,
        hours: result.businessDays * 24 // Aproximação para manter compatibilidade
    };
};


const CandidateCard = ({ candidate, onAction, contractFilter }: {
    candidate: ExtendedCandidate;
    onAction: (candidate: ExtendedCandidate, action: LegalStatus) => void;
    contractFilter?: string;
}) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const { data: legalData, isLoading: isLoadingLegal } = useLegalData(candidate.id);
    const reviewLegalData = useReviewLegalData();
    const { toast } = useToast();
    const { user } = useAuth();
    const { data: rhProfile } = useRHProfile(user?.id);

    const legalDataStatus = legalData?.review_status || 'not_collected';

    // Verificar se o candidato corresponde ao filtro de contrato
    const matchesContractFilter = !contractFilter ||
        (legalData?.company_contract &&
            legalData.company_contract.toLowerCase().includes(contractFilter.toLowerCase()));

    // Se há filtro ativo e o candidato não corresponde, não renderizar
    if (contractFilter && !matchesContractFilter) {
        return null;
    }

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
                <CardHeader className="pb-2 pt-3 px-4">
                    <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-base mb-1.5 flex items-center gap-1.5">
                                <User className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{candidate.name}</span>
                            </CardTitle>
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                    <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate">{candidate.job?.title || 'Vaga não especificada'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>{candidate.job?.city} - {candidate.job?.state}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                    <Building className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>{candidate.job?.department}</span>
                                </div>
                                {candidate.tj_validation_started_at && (
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="font-medium">
                                            Aguardando há: {getTimeElapsed(candidate.tj_validation_started_at).text}
                                        </span>
                                        {getTimeElapsed(candidate.tj_validation_started_at).isOverdue && (
                                            <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">Prazo excedido</Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5 ml-2 flex-shrink-0">
                            <Badge variant={
                                legalData?.review_status === 'approved' ? 'default' :
                                    legalData?.review_status === 'pending' ? 'secondary' :
                                        'destructive'
                            } className="text-xs">
                                {legalData?.review_status === 'approved' ? 'Aprovado' :
                                    legalData?.review_status === 'pending' ? 'Aguardando' :
                                        'Pendente'}
                            </Badge>
                            {legalData?.company_contract && (
                                <Badge variant="outline" className="text-blue-600 border-blue-200 text-xs">
                                    {legalData.company_contract}
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-3">
                    <div className="flex gap-1.5 mb-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={openDetailsModal}
                            className="flex-1 text-xs h-8"
                        >
                            <FileText className="w-3.5 h-3.5 mr-1.5" />
                            Ver Detalhes
                        </Button>
                    </div>

                    {legalData?.review_status !== 'approved' && (
                        <Alert className="mb-2 py-1.5 px-2">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <AlertDescription className="text-xs">
                                <strong>Atenção:</strong> Revise dados antes de aprovar.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex gap-1.5">
                        <Button
                            size="sm"
                            onClick={() => onAction(candidate, 'aprovado')}
                            disabled={legalData?.review_status !== 'approved'}
                            className="bg-green-600 hover:bg-green-700 flex-1 text-xs h-8"
                        >
                            <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                            Aprovar
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => onAction(candidate, 'aprovado_com_restricao')}
                            disabled={legalData?.review_status !== 'approved'}
                            className="bg-yellow-600 hover:bg-yellow-700 flex-1 text-xs h-8"
                        >
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                            Com Restrições
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAction(candidate, 'reprovado')}
                            className="text-red-600 border-red-200 hover:bg-red-50 flex-1 text-xs h-8"
                        >
                            <ThumbsDown className="w-3.5 h-3.5 mr-1" />
                            Reprovar
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

                        {/* Informações de Prazo de Validação */}
                        {candidate.tj_validation_started_at && (
                            <div className={`rounded-lg p-4 ${getTimeElapsed(candidate.tj_validation_started_at).isOverdue ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                                <h4 className={`font-semibold mb-3 flex items-center gap-2 ${getTimeElapsed(candidate.tj_validation_started_at).isOverdue ? 'text-red-900' : 'text-blue-900'}`}>
                                    <Clock className="w-4 h-4" />
                                    Prazo de Validação (48h)
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Chegou em:</span> {safeFormatDate(candidate.tj_validation_started_at, 'dd/MM/yyyy HH:mm')}
                                    </div>
                                    <div>
                                        <span className="font-medium">Tempo decorrido:</span> {getTimeElapsed(candidate.tj_validation_started_at).text}
                                    </div>
                                    {getTimeElapsed(candidate.tj_validation_started_at).isOverdue && (
                                        <div className="col-span-2">
                                            <Badge variant="destructive">⚠️ Prazo de 48h excedido</Badge>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

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
                                        {legalData.company_contract && (
                                            <div><span className="font-medium">Contrato da Empresa:</span> {legalData.company_contract}</div>
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
                                                    <div className="font-medium text-gray-900">{work.company}</div>
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
    // Paginação
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 50; // 50 candidatos por página para melhor performance

    const { data: candidatesData, isLoading, error } = useCandidatesForLegalValidation(currentPage, pageSize);
    const candidates = candidatesData?.candidates || [];
    const totalCount = candidatesData?.totalCount || 0;
    const totalPages = candidatesData?.totalPages || Math.ceil(totalCount / pageSize) || 1;

    // Debug: Log para verificar valores de paginação
    console.log('🔍 [LegalValidation] Paginação:', {
        currentPage,
        pageSize,
        totalCount,
        totalPages,
        candidatesCount: candidates.length
    });

    const updateCandidateStatus = useUpdateCandidateStatus();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [selectedCandidate, setSelectedCandidate] = useState<ExtendedCandidate | null>(null);
    const [contractFilter, setContractFilter] = useState<string>('');
    const [showFilter, setShowFilter] = useState(false);
    const [action, setAction] = useState<LegalStatus | null>(null);
    const [comments, setComments] = useState('');

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        // Scroll para o topo da lista quando mudar de página
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Resetar paginação quando filtro de contrato mudar
    useEffect(() => {
        setCurrentPage(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [contractFilter]);

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
                try {
                    const { data: { user: currentUser } } = await supabase.auth.getUser();
                    await supabase
                        .from('candidate_legal_data')
                        .update({
                            review_status: action === 'aprovado' ? 'approved' : action === 'reprovado' ? 'rejected' : 'approved_with_restrictions',
                            review_notes: comments.trim() || null,
                            reviewed_by: currentUser?.id || null,
                            reviewed_at: new Date().toISOString()
                        })
                        .eq('candidate_id', selectedCandidate.id);
                } catch (error) {
                    console.warn('Erro ao salvar dados jurídicos:', error);
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

    // Filtrar candidatos por contrato da empresa
    const filteredCandidates = candidates?.filter(candidate => {
        if (!contractFilter.trim()) return true;

        // Buscar dados jurídicos do candidato para verificar o contrato
        // Como não temos acesso direto aqui, vamos usar uma abordagem diferente
        // O filtro será aplicado quando os dados jurídicos forem carregados
        return true;
    }) || [];

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
                <TabsTrigger value="pending">Pendentes <Badge className="ml-2">{totalCount || 0}</Badge></TabsTrigger>
                <TabsTrigger value="history">Meu Histórico</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>Validação de candidato</CardTitle>
                                <CardDescription>Aprove ou reprove os candidatos na etapa de Validação TJ.</CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilter(!showFilter)}
                                className="flex items-center gap-2"
                            >
                                <Filter className="w-4 h-4" />
                                Filtrar por Contrato
                            </Button>
                        </div>

                        {showFilter && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <Label htmlFor="contract-filter" className="text-sm font-medium">
                                    Filtrar por Contrato da Empresa
                                </Label>
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        id="contract-filter"
                                        placeholder="Ex: CT 150.30"
                                        value={contractFilter}
                                        onChange={(e) => setContractFilter(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setContractFilter('')}
                                    >
                                        Limpar
                                    </Button>
                                </div>
                                {contractFilter && (
                                    <p className="text-xs text-gray-600 mt-2">
                                        Mostrando candidatos com contrato contendo: "{contractFilter}"
                                    </p>
                                )}
                            </div>
                        )}
                    </CardHeader>
                </Card>
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="ml-2">Carregando candidatos...</span>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                            {candidates && candidates.length > 0 ? candidates.map(c => (
                                <CandidateCard key={c.id} candidate={c} onAction={handleActionClick} contractFilter={contractFilter} />
                            )) : (
                                <Card className="col-span-full">
                                    <CardContent className="py-12 text-center">
                                        <p className="text-gray-500">Nenhum candidato aguardando validação.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Controles de Paginação */}
                        {totalCount > 0 && (
                            <div className="flex items-center justify-between mt-6 px-6 py-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600">
                                    Mostrando {currentPage * pageSize + 1} a {Math.min((currentPage + 1) * pageSize, totalCount)} de {totalCount} candidatos
                                </div>

                                {totalPages > 1 ? (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(0)}
                                            disabled={currentPage === 0}
                                        >
                                            Primeira
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 0}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Anterior
                                        </Button>

                                        <span className="px-3 py-1 text-sm font-medium">
                                            Página {currentPage + 1} de {totalPages}
                                        </span>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage >= totalPages - 1}
                                        >
                                            Próxima
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(totalPages - 1)}
                                            disabled={currentPage >= totalPages - 1}
                                        >
                                            Última
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500">
                                        Todos os candidatos estão nesta página
                                    </div>
                                )}
                            </div>
                        )}
                    </>
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