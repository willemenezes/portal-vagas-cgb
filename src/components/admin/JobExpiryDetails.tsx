import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JobExpiryDetailsProps {
    job: {
        id: string;
        title: string;
        created_at: string;
        updated_at?: string;
        expires_at?: string;
        quantity?: number;
        quantity_filled?: number;
        status?: string;
        approval_status?: string;
    };
    className?: string;
}

export const JobExpiryDetails: React.FC<JobExpiryDetailsProps> = ({
    job,
    className
}) => {
    // Calcular datas e prazos
    const createdDate = new Date(job.created_at);
    const updatedDate = job.updated_at ? new Date(job.updated_at) : null;
    const expiryDate = job.expires_at ? new Date(job.expires_at) : null;

    // Calcular dias até expiração
    const getDaysUntilExpiry = () => {
        if (!expiryDate) return null;
        const now = new Date();
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const daysUntilExpiry = getDaysUntilExpiry();
    const remainingPositions = (job.quantity || 1) - (job.quantity_filled || 0);

    // Status de expiração
    const getExpiryStatus = () => {
        if (!daysUntilExpiry) return 'unknown';
        if (daysUntilExpiry < 0) return 'expired';
        if (daysUntilExpiry <= 3) return 'expiring_soon';
        return 'active';
    };

    const expiryStatus = getExpiryStatus();

    // Status de preenchimento
    const getFillStatus = () => {
        if (remainingPositions === 0) return 'filled';
        if (remainingPositions <= (job.quantity || 1) * 0.3) return 'almost_filled';
        return 'available';
    };

    const fillStatus = getFillStatus();

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Cronograma da Vaga
                </CardTitle>
                <CardDescription>
                    Acompanhamento de prazos e status de preenchimento
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Datas importantes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">Criada em:</span>
                        </div>
                        <p className="text-sm text-gray-600 ml-6">
                            {createdDate.toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>

                    {updatedDate && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">Aprovada em:</span>
                            </div>
                            <p className="text-sm text-gray-600 ml-6">
                                {updatedDate.toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    )}
                </div>

                {/* Status de expiração */}
                {expiryDate && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            {expiryStatus === 'expired' ? (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                            ) : expiryStatus === 'expiring_soon' ? (
                                <Clock className="w-4 h-4 text-yellow-500" />
                            ) : (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            <span className="text-sm font-medium">Expira em:</span>
                        </div>
                        <div className="ml-6 space-y-1">
                            <p className="text-sm text-gray-600">
                                {expiryDate.toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                })}
                            </p>
                            <Badge
                                variant={
                                    expiryStatus === 'expired' ? 'destructive' :
                                        expiryStatus === 'expiring_soon' ? 'secondary' : 'outline'
                                }
                                className={cn(
                                    "text-xs",
                                    expiryStatus === 'expired' && "bg-red-100 text-red-700 border-red-200",
                                    expiryStatus === 'expiring_soon' && "bg-yellow-100 text-yellow-700 border-yellow-200",
                                    expiryStatus === 'active' && "bg-green-100 text-green-700 border-green-200"
                                )}
                            >
                                {daysUntilExpiry! < 0
                                    ? `Expirada há ${Math.abs(daysUntilExpiry!)} dias`
                                    : daysUntilExpiry === 0
                                        ? "Expira hoje"
                                        : daysUntilExpiry === 1
                                            ? "Expira amanhã"
                                            : `${daysUntilExpiry} dias restantes`
                                }
                            </Badge>
                        </div>
                    </div>
                )}

                {/* Status de preenchimento */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium">Preenchimento:</span>
                    </div>
                    <div className="ml-6 space-y-1">
                        <p className="text-sm text-gray-600">
                            {remainingPositions} de {job.quantity || 1} vagas disponíveis
                        </p>
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-xs",
                                fillStatus === 'filled' && "bg-green-100 text-green-700 border-green-200",
                                fillStatus === 'almost_filled' && "bg-yellow-100 text-yellow-700 border-yellow-200",
                                fillStatus === 'available' && "bg-blue-100 text-blue-700 border-blue-200"
                            )}
                        >
                            {fillStatus === 'filled' ? 'Completa' :
                                fillStatus === 'almost_filled' ? 'Quase completa' : 'Disponível'}
                        </Badge>
                    </div>
                </div>

                {/* Resumo de ações */}
                <div className="pt-2 border-t">
                    <div className="text-xs text-gray-500 space-y-1">
                        <p>• <strong>Prazo de contratação:</strong> 20 dias corridos após aprovação</p>
                        <p>• <strong>Data de expiração:</strong> Calculada automaticamente</p>
                        <p>• <strong>Renovação:</strong> Necessária após expiração</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default JobExpiryDetails;



















