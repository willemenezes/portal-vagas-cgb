import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JobQuantityBadgeProps {
    quantity?: number;
    quantityFilled?: number;
    expiresAt?: string;
    className?: string;
}

export const JobQuantityBadge: React.FC<JobQuantityBadgeProps> = ({
    quantity = 1,
    quantityFilled = 0,
    expiresAt,
    className
}) => {
    // Calcular dias até expiração
    const getDaysUntilExpiry = (expiryDate: string) => {
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const daysUntilExpiry = expiresAt ? getDaysUntilExpiry(expiresAt) : null;
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

            {/* Badge de Expiração */}
            {expiresAt && (
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

                    {isExpired ? (
                        `Expirou há ${Math.abs(daysUntilExpiry!)} dias`
                    ) : daysUntilExpiry === 0 ? (
                        "Expira hoje"
                    ) : daysUntilExpiry === 1 ? (
                        "Expira amanhã"
                    ) : (
                        `${daysUntilExpiry} dias restantes`
                    )}
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







