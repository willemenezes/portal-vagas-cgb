import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, CheckCircle, TrendingUp, Users, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpiryStats {
    expired_jobs: number;
    expiring_soon: number;
    active_jobs: number;
    total_jobs: number;
    total_positions: number;
    filled_positions: number;
    remaining_positions: number;
}

interface ExpiryDashboardProps {
    stats?: ExpiryStats;
    isLoading?: boolean;
    className?: string;
}

export const ExpiryDashboard: React.FC<ExpiryDashboardProps> = ({
    stats,
    isLoading = false,
    className
}) => {
    if (isLoading) {
        return (
            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    const fillRate = stats.total_positions > 0
        ? (stats.filled_positions / stats.total_positions) * 100
        : 0;

    const expiryRate = stats.total_jobs > 0
        ? ((stats.expired_jobs + stats.expiring_soon) / stats.total_jobs) * 100
        : 0;

    return (
        <div className={cn("space-y-4", className)}>
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Vagas Expiradas */}
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-600">Vagas Expiradas</p>
                                <p className="text-2xl font-bold text-red-700">{stats.expired_jobs}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        {stats.expired_jobs > 0 && (
                            <div className="mt-2">
                                <Badge variant="destructive" className="text-xs">
                                    Ação necessária
                                </Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Vagas Expirando */}
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-yellow-600">Expirando em Breve</p>
                                <p className="text-2xl font-bold text-yellow-700">{stats.expiring_soon}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                        {stats.expiring_soon > 0 && (
                            <div className="mt-2">
                                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">
                                    ≤ 3 dias restantes
                                </Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Vagas Ativas */}
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600">Vagas Ativas</p>
                                <p className="text-2xl font-bold text-green-700">{stats.active_jobs}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <div className="mt-2">
                            <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                                {stats.remaining_positions} posições restantes
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Total de Posições */}
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Total de Posições</p>
                                <p className="text-2xl font-bold text-blue-700">{stats.total_positions}</p>
                            </div>
                            <Users className="w-8 h-8 text-blue-500" />
                        </div>
                        <div className="mt-2">
                            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                                {stats.filled_positions} preenchidas
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Métricas Detalhadas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Taxa de Preenchimento */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Taxa de Preenchimento
                        </CardTitle>
                        <CardDescription>
                            Percentual de posições preenchidas do total disponível
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Preenchidas: {stats.filled_positions}</span>
                                <span>Total: {stats.total_positions}</span>
                            </div>
                            <Progress value={fillRate} className="h-2" />
                            <p className="text-right text-sm font-medium">
                                {fillRate.toFixed(1)}%
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Status de Validade */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Status de Validade
                        </CardTitle>
                        <CardDescription>
                            Distribuição das vagas por status de expiração
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-red-600">Expiradas</span>
                                <Badge variant="destructive">{stats.expired_jobs}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-yellow-600">Expirando (&le;3 dias)</span>
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                                    {stats.expiring_soon}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-green-600">Ativas (&gt;3 dias)</span>
                                <Badge variant="outline" className="border-green-300 text-green-700">
                                    {stats.active_jobs}
                                </Badge>
                            </div>
                            {expiryRate > 0 && (
                                <div className="pt-2 border-t">
                                    <div className="flex justify-between text-sm">
                                        <span>Taxa de risco:</span>
                                        <span className={cn(
                                            "font-medium",
                                            expiryRate > 50 ? "text-red-600" :
                                                expiryRate > 25 ? "text-yellow-600" : "text-green-600"
                                        )}>
                                            {expiryRate.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ExpiryDashboard;
