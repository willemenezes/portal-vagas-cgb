import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateBusinessDaysUntil, formatBusinessDaysLabel } from '@/utils/business-days';

interface JobQuantityBadgeProps {
    quantity?: number;
    quantityFilled?: number;
    expiresAt?: string;
    flowStatus?: 'ativa' | 'concluida' | 'congelada';
    className?: string;
}

export const JobQuantityBadge: React.FC<JobQuantityBadgeProps> = ({
    quantity = 1,
    quantityFilled = 0,
    expiresAt,
    flowStatus,
    className
}) => {
    // Normalizar flowStatus para evitar problemas com acentos/maiúsculas/variações
    const normalize = (value?: string | null) => {
        if (!value) return '';
        try {
            // Remover acentos e padronizar para minúsculas
            return value
                .toLowerCase()
                .normalize('NFD')
                .replace(/\p{Diacritic}/gu, '');
        } catch {
            return String(value).toLowerCase();
        }
    };

    const normalizedFlow = normalize(flowStatus);
    // Se a vaga está concluída ou congelada, não mostrar contagem regressiva
    const isInactive = normalizedFlow === 'concluida' || normalizedFlow === 'congelada';

    const daysUntilExpiry = expiresAt ? calculateBusinessDaysUntil(expiresAt) : null;
    const remainingPositions = quantity - quantityFilled;
    const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
    const isFilled = remainingPositions === 0;

    return (
        <div className={cn("flex flex-wrap gap-1", className)}>
            {/* Badge de Quantidade */}
            {quantity > 1 && (
                <Badge
                    variant={isFilled ? "secondary" : "default"}
                    className="flex items-center gap-1"
                >
                    <Users className="w-3 h-3" />
                    {remainingPositions}/{quantity}
                    {isFilled && " (Completa)"}
                </Badge>
            )}

            {/* Badge de Expiração - só exibir se a vaga estiver ativa */}
            {expiresAt && !isInactive && (
                <Badge
                    variant={isExpired ? "destructive" : isExpiringSoon ? "secondary" : "outline"}
                    className={cn(
                        "flex items-center gap-1",
                        isExpired && "bg-red-100 text-red-700 border-red-200",
                        isExpiringSoon && "bg-yellow-100 text-yellow-700 border-yellow-200"
                    )}
                >
                    {isExpired ? (
                        <AlertTriangle className="w-3 h-3" />
                    ) : isFilled ? (
                        <CheckCircle className="w-3 h-3" />
                    ) : (
                        <Clock className="w-3 h-3" />
                    )}

                    {daysUntilExpiry !== null && formatBusinessDaysLabel(daysUntilExpiry)}
                </Badge>
            )}

            {/* Badge de Status Especial */}
            {isFilled && !isExpired && (
                <Badge variant="default" className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Completa
                </Badge>
            )}
        </div>
    );
};

export default JobQuantityBadge;















