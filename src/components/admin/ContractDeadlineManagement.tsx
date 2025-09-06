import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle,
    Users,
    Search,
    Filter,
    RefreshCw,
    Eye,
    Edit
} from 'lucide-react';
import { useAllJobs } from '@/hooks/useJobs';
import { cn } from '@/lib/utils';

export const ContractDeadlineManagement: React.FC = () => {
    const { data: allJobs = [], isLoading } = useAllJobs();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Filtrar vagas por busca e status
    const filteredJobs = allJobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.city.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'expired' && job.expires_at && new Date(job.expires_at) < new Date()) ||
            (statusFilter === 'expiring_soon' && job.expires_at && (() => {
                const daysUntilExpiry = Math.ceil((new Date(job.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
            })()) ||
            (statusFilter === 'active' && job.expires_at && new Date(job.expires_at) > new Date());

        return matchesSearch && matchesStatus;
    });

    // Calcular estatísticas
    const stats = {
        total: allJobs.length,
        expired: allJobs.filter(job => job.expires_at && new Date(job.expires_at) < new Date()).length,
        expiring_soon: allJobs.filter(job => {
            if (!job.expires_at) return false;
            const daysUntilExpiry = Math.ceil((new Date(job.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
        }).length,
        active: allJobs.filter(job => job.expires_at && new Date(job.expires_at) > new Date()).length
    };

    // Função para calcular dias até expiração
    const getDaysUntilExpiry = (expiryDate: string) => {
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Função para obter status de expiração
    const getExpiryStatus = (expiryDate: string) => {
        const days = getDaysUntilExpiry(expiryDate);
        if (days < 0) return { status: 'expired', color: 'red', text: `Expirada há ${Math.abs(days)} dias` };
        if (days === 0) return { status: 'expiring_today', color: 'orange', text: 'Expira hoje' };
        if (days === 1) return { status: 'expiring_tomorrow', color: 'orange', text: 'Expira amanhã' };
        if (days <= 3) return { status: 'expiring_soon', color: 'yellow', text: `${days} dias restantes` };
        return { status: 'active', color: 'green', text: `${days} dias restantes` };
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-cgb-primary" />
                <span className="ml-2 text-gray-600">Carregando prazos de contratação...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Prazos de Contratação</h1>
                    <p className="text-gray-600">Gerencie os prazos de 20 dias para contratação das vagas</p>
                </div>
                <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                </Button>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total de Vagas</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <Users className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-600">Expiradas</p>
                                <p className="text-2xl font-bold text-red-700">{stats.expired}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-yellow-600">Expirando em Breve</p>
                                <p className="text-2xl font-bold text-yellow-700">{stats.expiring_soon}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600">Ativas</p>
                                <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Buscar por título, departamento ou cidade..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Filtrar por status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as vagas</SelectItem>
                                    <SelectItem value="expired">Expiradas</SelectItem>
                                    <SelectItem value="expiring_soon">Expirando em breve</SelectItem>
                                    <SelectItem value="active">Ativas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabela de vagas */}
            <Card>
                <CardHeader>
                    <CardTitle>Vagas e Prazos</CardTitle>
                    <CardDescription>
                        Lista de todas as vagas com seus respectivos prazos de contratação
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vaga</TableHead>
                                <TableHead>Departamento</TableHead>
                                <TableHead>Local</TableHead>
                                <TableHead>Quantidade</TableHead>
                                <TableHead>Data de Expiração</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredJobs.map((job) => {
                                const expiryInfo = job.expires_at ? getExpiryStatus(job.expires_at) : null;
                                const remainingPositions = (job.quantity || 1) - (job.quantity_filled || 0);

                                return (
                                    <TableRow key={job.id}>
                                        <TableCell className="font-medium">{job.title}</TableCell>
                                        <TableCell>{job.department}</TableCell>
                                        <TableCell>{job.city}, {job.state}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm">
                                                    {remainingPositions}/{job.quantity || 1}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {job.expires_at ? (
                                                <div className="space-y-1">
                                                    <p className="text-sm">
                                                        {new Date(job.expires_at).toLocaleDateString('pt-BR')}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(job.expires_at).toLocaleTimeString('pt-BR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">Não definido</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {expiryInfo ? (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-xs",
                                                        expiryInfo.color === 'red' && "bg-red-100 text-red-700 border-red-200",
                                                        expiryInfo.color === 'orange' && "bg-orange-100 text-orange-700 border-orange-200",
                                                        expiryInfo.color === 'yellow' && "bg-yellow-100 text-yellow-700 border-yellow-200",
                                                        expiryInfo.color === 'green' && "bg-green-100 text-green-700 border-green-200"
                                                    )}
                                                >
                                                    {expiryInfo.text}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">
                                                    Sem prazo
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>

                    {filteredJobs.length === 0 && (
                        <div className="text-center py-8">
                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Nenhuma vaga encontrada com os filtros aplicados</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ContractDeadlineManagement;
