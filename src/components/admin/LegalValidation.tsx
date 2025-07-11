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
import { useLegalData, useReviewLegalData, useMyApprovedValidations, useCandidatesForLegalValidation } from '@/hooks/useLegalData';
import { useRHProfile } from '@/hooks/useRH';
import { useUpdateCandidateStatus } from '@/hooks/useCandidates';
import { maskCPF, maskRG } from '@/utils/legal-validation';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApprovedLegalValidations from './ApprovedLegalValidations';

type LegalStatus = 'aprovado' | 'reprovado' | 'aprovado_com_restricao';

interface ExtendedCandidate extends Candidate {
    job?: {
        title: string; city: string; state: string; department: string; type: string; workload: string; description: string;
    };
    candidate_legal_data?: { id: string; review_status: string; collected_at: string; }[];
}

const CandidateCard = ({ candidate, onAction }: { candidate: ExtendedCandidate; onAction: (candidate: ExtendedCandidate, action: LegalStatus) => void }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { data: legalData, isLoading: isLoadingLegal } = useLegalData(candidate.id);
    const reviewLegalData = useReviewLegalData();
    const { toast } = useToast();
    const { user } = useAuth();
    const { data: rhProfile } = useRHProfile(user?.id);

    const legalDataStatus = legalData?.review_status || 'not_collected';

    const handleLegalReview = async (status: 'approved' | 'rejected' | 'request_changes', notes?: string) => {
        try {
            await reviewLegalData.mutateAsync({ candidateId: candidate.id, status, notes });
        } catch (error) {
            toast({ title: 'Erro ao revisar dados', description: 'Não foi possível salvar a revisão dos dados jurídicos.', variant: 'destructive' });
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{candidate.name}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Briefcase className="w-4 h-4" /> <span>{candidate.job?.title}</span>
                            <MapPin className="w-4 h-4 ml-2" /> <span>{candidate.job?.city} - {candidate.job?.state}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                        {legalData?.review_status !== 'approved' && (
                            <Alert className="mb-2 text-sm">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Revise os dados jurídicos primeiro.
                                </AlertDescription>
                            </Alert>
                        )}
                        <Button size="sm" onClick={() => onAction(candidate, 'aprovado')} disabled={legalData?.review_status !== 'approved'} className="bg-green-600 hover:bg-green-700">
                            <ThumbsUp className="w-4 h-4 mr-1" /> Aprovar Candidato
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onAction(candidate, 'reprovado')} className="text-red-600 border-red-200 hover:bg-red-50">
                            <ThumbsDown className="w-4 h-4 mr-1" /> Reprovar Candidato
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
                        {isLoadingLegal ? <Loader2 className="animate-spin" /> : legalData && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-semibold text-sm text-blue-900 mb-3 flex items-center gap-2"><Shield className="w-4 h-4" />Dados para Validação Jurídica</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                                    {/* Dados Pessoais */}
                                    <div className="space-y-2">
                                        <h5 className="font-medium text-xs text-blue-800 uppercase">Dados Pessoais</h5>
                                        <div><span className="font-medium">Nome:</span> {legalData.full_name}</div>
                                        <div><span className="font-medium">CPF:</span> {rhProfile?.role === 'juridico' ? legalData.cpf : maskCPF(legalData.cpf)}</div>
                                        <div><span className="font-medium">RG:</span> {rhProfile?.role === 'juridico' ? legalData.rg : maskRG(legalData.rg)}</div>
                                        <div><span className="font-medium">Data Nasc.:</span> {format(new Date(legalData.birth_date), 'dd/MM/yyyy')}</div>
                                        <div><span className="font-medium">Naturalidade:</span> {legalData.birth_city}/{legalData.birth_state}</div>
                                    </div>

                                    {/* Filiação */}
                                    <div className="space-y-2">
                                        <h5 className="font-medium text-xs text-blue-800 uppercase">Filiação</h5>
                                        <div><span className="font-medium">Mãe:</span> {legalData.mother_name}</div>
                                        <div><span className="font-medium">Pai:</span> {legalData.father_name || 'Não informado'}</div>
                                    </div>

                                    {/* Informações Adicionais */}
                                    <div className="space-y-2">
                                        <h5 className="font-medium text-xs text-blue-800 uppercase">Informações Adicionais</h5>
                                        <div><span className="font-medium">Função Pretendida:</span> {legalData.desired_position}</div>
                                        <div><span className="font-medium">Ex-colaborador:</span> {legalData.is_former_employee ? 'Sim' : 'Não'}</div>
                                        <div><span className="font-medium">PCD:</span> {legalData.is_pcd ? 'Sim' : 'Não'}</div>
                                        {legalData.responsible_name && (
                                            <div><span className="font-medium">Responsável:</span> {legalData.responsible_name}</div>
                                        )}
                                    </div>

                                    {/* Histórico Profissional */}
                                    {legalData.work_history && legalData.work_history.length > 0 && (
                                        <div className="col-span-full space-y-2">
                                            <h5 className="font-medium text-xs text-blue-800 uppercase">Histórico Profissional</h5>
                                            <div className="space-y-2">
                                                {legalData.work_history.map((work, index) => (
                                                    <div key={index} className="text-sm bg-white rounded p-2 border">
                                                        <div className="font-medium">{work.position} - {work.company}</div>
                                                        <div className="text-xs text-gray-600">
                                                            {format(new Date(work.start_date), 'MM/yyyy')} -
                                                            {work.is_current ? ' Atual' : work.end_date ? ` ${format(new Date(work.end_date), 'MM/yyyy')}` : ''}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {legalData.review_status === 'pending' && (
                                    <div className="mt-4 pt-4 border-t flex gap-2">
                                        <Button size="sm" onClick={() => handleLegalReview('approved')} className="bg-green-600 hover:bg-green-700">
                                            <CheckCircle className="w-4 h-4 mr-1" /> Aprovar Dados
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => { const notes = prompt('Motivo da rejeição:'); if (notes) handleLegalReview('rejected', notes); }} className="text-red-500">
                                            <XCircle className="w-4 h-4 mr-1" /> Rejeitar Dados
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
};

const LegalValidation = () => {
    const { data: candidates, isLoading } = useCandidatesForLegalValidation();
    const updateCandidateStatus = useUpdateCandidateStatus();
    const queryClient = useQueryClient();
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
        if (action !== 'aprovado' && !comments) {
            toast({ title: 'Comentário obrigatório', variant: 'destructive' });
            return;
        }

        const newStatus = action === 'aprovado' ? 'Validação Frota' : 'Reprovado';

        updateCandidateStatus.mutate(
            { id: selectedCandidate.id, status: newStatus as any },
            {
                onSuccess: () => {
                    toast({ title: 'Validação Salva!' });
                    setSelectedCandidate(null);
                    setAction(null);
                    queryClient.invalidateQueries({ queryKey: ['candidatesForLegalValidation'] });
                },
                onError: (error: any) => toast({ title: 'Erro ao Salvar', description: error.message, variant: 'destructive' })
            }
        );
    };

    return (
        <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">Pendentes <Badge className="ml-2">{candidates?.length || 0}</Badge></TabsTrigger>
                <TabsTrigger value="history">Meu Histórico</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Validação Legal de Candidatos</CardTitle>
                        <CardDescription>Aprove ou reprove os candidatos na etapa de Validação TJ.</CardDescription>
                    </CardHeader>
                </Card>
                {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                    <div className="space-y-4 mt-4">
                        {candidates && candidates.length > 0 ? candidates.map(c => <CandidateCard key={c.id} candidate={c} onAction={handleActionClick} />)
                            : <Card><CardContent className="py-12 text-center">Nenhum candidato aguardando validação.</CardContent></Card>}
                    </div>
                )}
            </TabsContent>
            <TabsContent value="history" className="mt-6">
                <ApprovedLegalValidations />
            </TabsContent>
            <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Confirmar Validação</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        <p>Deseja realmente <strong>{action === 'aprovado' ? 'aprovar' : 'reprovar'}</strong> o candidato <strong>{selectedCandidate?.name}</strong>?</p>
                        {action !== 'aprovado' && (
                            <Textarea placeholder="Motivo da reprovação..." value={comments} onChange={(e) => setComments(e.target.value)} />
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedCandidate(null)}>Cancelar</Button>
                        <Button onClick={handleConfirm} disabled={updateCandidateStatus.isPending}>
                            {updateCandidateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Tabs>
    );
};

export default LegalValidation; 