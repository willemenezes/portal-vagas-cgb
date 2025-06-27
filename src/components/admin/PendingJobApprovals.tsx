import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Send, Loader2, FileText, Calendar, MapPin } from 'lucide-react';
import { Job, useUpdateJob } from '@/hooks/useJobs';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingJobApprovalsProps {
    pendingJobs: Job[];
    isLoading: boolean;
}

const PendingJobApprovals: React.FC<PendingJobApprovalsProps> = ({ pendingJobs, isLoading }) => {
    const { toast } = useToast();
    const updateJob = useUpdateJob();
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isRejectModalOpen, setRejectModalOpen] = useState(false);

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

    const handleApproval = async (jobId: string) => {
        try {
            await updateJob.mutateAsync({ id: jobId, approval_status: 'active', status: 'active' });
            toast({ title: 'Vaga Aprovada!', description: 'A vaga agora está ativa e pública.' });
        } catch (error) {
            toast({ title: 'Erro', description: 'Não foi possível aprovar a vaga.', variant: 'destructive' });
        }
    };

    const handleRejection = async () => {
        if (!selectedJob || !rejectionReason.trim()) {
            toast({ title: 'Atenção', description: 'Por favor, forneça um motivo para a rejeição.', variant: 'destructive' });
            return;
        }
        try {
            await updateJob.mutateAsync({ 
                id: selectedJob.id, 
                approval_status: 'rejected', 
                status: 'draft',
                rejection_reason: rejectionReason 
            });
            toast({ title: 'Vaga Rejeitada', description: 'A vaga foi devolvida para o RH com suas observações.' });
            setRejectModalOpen(false);
            setRejectionReason('');
            setSelectedJob(null);
        } catch (error) {
            toast({ title: 'Erro', description: 'Não foi possível rejeitar a vaga.', variant: 'destructive' });
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="w-5 h-5 text-cgb-primary-dark" />
                        Requisições de Vagas Pendentes
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-40 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </CardContent>
            </Card>
        );
    }

    if (pendingJobs.length === 0) {
        return null; // Não renderiza nada se não houver vagas pendentes
    }

    return (
        <Card className="bg-amber-50 border-amber-200 shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Send className="w-6 h-6" />
                    Requisições de Vagas Pendentes
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {pendingJobs.map(job => (
                        <div key={job.id} className="p-4 border rounded-lg bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex-grow">
                                <h3 className="font-bold text-lg text-gray-800">{job.title}</h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                                    <span className="flex items-center gap-1"><FileText size={14} />{job.department}</span>
                                    <span className="flex items-center gap-1"><MapPin size={14} />{job.city}, {job.state}</span>
                                    <span className="flex items-center gap-1"><Calendar size={14} />
                                        Enviado {getSafeDateLabel(job.updated_at || job.created_at)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-shrink-0 flex gap-2 self-end sm:self-center">
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
                                    className="bg-green-500 hover:bg-green-600"
                                    onClick={() => handleApproval(job.id)}
                                    disabled={updateJob.isLoading}
                                >
                                    <Check className="w-4 h-4 mr-1" /> Aprovar
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>

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
                            placeholder="Ex: Faltam detalhes sobre as responsabilidades do cargo..."
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleRejection} disabled={updateJob.isLoading || !rejectionReason.trim()} className="bg-red-600 hover:bg-red-700">
                            {updateJob.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Rejeição'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default PendingJobApprovals; 