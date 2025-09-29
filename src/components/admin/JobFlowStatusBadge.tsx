import { Badge } from '@/components/ui/badge';
import { CheckCircle, Pause, CircleCheck } from 'lucide-react';

type JobFlowStatus = 'ativa' | 'concluida' | 'congelada';

interface JobFlowStatusBadgeProps {
    flowStatus?: JobFlowStatus | null;
    className?: string;
    showIcon?: boolean;
}

const FLOW_STATUS_CONFIG = {
    ativa: {
        label: 'Ativa',
        icon: CheckCircle,
        className: 'bg-green-50 text-green-700 border-green-200',
        iconColor: 'text-green-600'
    },
    concluida: {
        label: 'Concluída',
        icon: CircleCheck,
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        iconColor: 'text-blue-600'
    },
    congelada: {
        label: 'Congelada',
        icon: Pause,
        className: 'bg-orange-50 text-orange-700 border-orange-200',
        iconColor: 'text-orange-600'
    }
};

export const JobFlowStatusBadge = ({
    flowStatus,
    className = '',
    showIcon = true
}: JobFlowStatusBadgeProps) => {
    if (!flowStatus || flowStatus === 'ativa') return null;

    const config = FLOW_STATUS_CONFIG[flowStatus];
    if (!config) return null;

    const Icon = config.icon;

    return (
        <Badge
            variant="outline"
            className={`${config.className} ${className} flex items-center gap-1`}
        >
            {showIcon && <Icon className={`w-3 h-3 ${config.iconColor}`} />}
            {config.label}
        </Badge>
    );
};

export default JobFlowStatusBadge;
