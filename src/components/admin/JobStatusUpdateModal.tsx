import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, Pause, CircleCheck } from 'lucide-react';
import { Job } from '@/hooks/useJobs';

type JobFlowStatus = 'ativa' | 'concluida' | 'congelada';

interface JobStatusUpdateModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (status: JobFlowStatus) => void;
    job: Job | null;
    candidateName: string;
    isLoading?: boolean;
}

const JOB_STATUS_OPTIONS: { value: JobFlowStatus; label: string; description: string; icon: any; color: string }[] = [
    {
        value: 'ativa',
        label: 'Ativa',
        description: 'Vaga continua ativa e visível para novos candidatos no site público',
        icon: CheckCircle,
        color: 'text-green-600'
    },
    {
        value: 'concluida',
        label: 'Concluída',
        description: 'Vaga foi preenchida e não aparecerá mais no site público',
        icon: CircleCheck,
        color: 'text-blue-600'
    },
    {
        value: 'congelada',
        label: 'Congelada',
        description: 'Vaga pausada temporariamente, não aparecerá no site público',
        icon: Pause,
        color: 'text-orange-600'
    }
];

export const JobStatusUpdateModal = ({
    open,
    onClose,
    onConfirm,
    job,
    candidateName,
    isLoading = false
}: JobStatusUpdateModalProps) => {
    const [selectedStatus, setSelectedStatus] = useState<JobFlowStatus>('ativa');

    const handleConfirm = () => {
        onConfirm(selectedStatus);
    };

    const selectedOption = JOB_STATUS_OPTIONS.find(opt => opt.value === selectedStatus);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        Candidato Aprovado!
                    </DialogTitle>
                    <DialogDescription className="text-base mt-2">
                        <strong className="text-gray-900">{candidateName}</strong> foi aprovado para a vaga{' '}
                        <strong className="text-gray-900">{job?.title}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800 font-medium mb-2">
                            📋 Qual é o status atual desta vaga?
                        </p>
                        <p className="text-xs text-blue-700">
                            Escolha o status que melhor representa a situação da vaga agora que um candidato foi aprovado.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Status da Vaga
                        </label>
                        <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as JobFlowStatus)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                                {JOB_STATUS_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    return (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                                <Icon className={`w-4 h-4 ${option.color}`} />
                                                <span className="font-medium">{option.label}</span>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedOption && (
                        <div className={`p-3 rounded-lg border ${selectedOption.value === 'ativa' ? 'bg-green-50 border-green-200' :
                                selectedOption.value === 'concluida' ? 'bg-blue-50 border-blue-200' :
                                    'bg-orange-50 border-orange-200'
                            }`}>
                            <p className={`text-sm ${selectedOption.value === 'ativa' ? 'text-green-800' :
                                    selectedOption.value === 'concluida' ? 'text-blue-800' :
                                        'text-orange-800'
                                }`}>
                                <strong>{selectedOption.label}:</strong> {selectedOption.description}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Confirmar
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
