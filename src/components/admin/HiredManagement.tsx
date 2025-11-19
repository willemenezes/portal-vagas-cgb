import React, { useMemo, useState } from 'react';
import { useAllCandidates } from '@/hooks/useCandidates';
import { useAllJobs } from '@/hooks/useJobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, FileText, UserCheck, Briefcase, MapPin, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useRHProfile } from '@/hooks/useRH';

const HiredManagement = () => {
    const { user } = useAuth();
    const { data: rhProfile } = useRHProfile(user?.id);
    // Para contratados, precisamos de todos para não perder registros
    const { data: candidates = [], isLoading: isLoadingCandidates } = useAllCandidates(rhProfile || undefined);
    const { data: jobs = [], isLoading: isLoadingJobs } = useAllJobs();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        jobId: 'all',
        state: 'all',
    });

    const hiredCandidates = useMemo(() => {
        return candidates
            .filter(c => c.status === 'Aprovado')
            .filter(c => filters.jobId === 'all' ? true : c.job_id === filters.jobId)
            .filter(c => filters.state === 'all' ? true : c.state === filters.state)
            .filter(c => {
                if (!searchTerm) return true;
                const searchLower = searchTerm.toLowerCase();
                return (
                    c.name?.toLowerCase().includes(searchLower) ||
                    c.email?.toLowerCase().includes(searchLower)
                );
            });
    }, [candidates, searchTerm, filters]);

    const uniqueStates = useMemo(() => {
        const approvedCandidates = candidates.filter(c => c.status === 'Aprovado');
        return [...new Set(approvedCandidates.map(c => c.state).filter(Boolean))];
    }, [candidates]);

    if (isLoadingCandidates || isLoadingJobs) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-6 h-6 text-green-600" />
                    Candidatos Contratados ({hiredCandidates.length})
                </CardTitle>
                <div className="flex flex-col md:flex-row gap-4 pt-4 items-center">
                    <div className="relative w-full md:flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="Buscar por nome ou e-mail..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={filters.jobId} onValueChange={value => setFilters(prev => ({ ...prev, jobId: value }))}>
                        <SelectTrigger className="w-full md:w-auto">
                            <Briefcase className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Todas as Vagas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Vagas</SelectItem>
                            {jobs.map(job => (
                                <SelectItem key={job.id} value={job.id}>{job.title} - {job.city}, {job.state}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.state} onValueChange={value => setFilters(prev => ({ ...prev, state: value }))}>
                        <SelectTrigger className="w-full md:w-auto">
                            <MapPin className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Todos os Estados" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Estados</SelectItem>
                            {uniqueStates.map(state => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Vaga</TableHead>
                                    <TableHead>Contato</TableHead>
                                    <TableHead>Data da Aprovação</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Currículo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hiredCandidates.length > 0 ? (
                                    hiredCandidates.map(candidate => {
                                        const hasRestriction = candidate.legal_validation_comment && candidate.legal_validation_comment.trim() !== '';
                                        return (
                                            <TableRow key={candidate.id}>
                                                <TableCell className="font-medium">{candidate.name}</TableCell>
                                                <TableCell>{candidate.job?.title || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <div>{candidate.email}</div>
                                                    <div className="text-gray-500">{candidate.phone}</div>
                                                </TableCell>
                                                <TableCell>
                                                    {format(new Date(candidate.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                </TableCell>
                                                <TableCell>
                                                    {hasRestriction ? (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300 cursor-help flex items-center gap-1 w-fit">
                                                                    <AlertTriangle className="w-3 h-3" />
                                                                    Aprovado com Restrição
                                                                </Badge>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-sm">
                                                                <p className="font-semibold mb-1">Restrições:</p>
                                                                <p className="text-sm">{candidate.legal_validation_comment}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
                                                            Aprovado
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" asChild disabled={!candidate.resume_file_url}>
                                                        <a href={candidate.resume_file_url || '#'} target="_blank" rel="noopener noreferrer">
                                                            <FileText className="w-4 h-4 mr-2" />
                                                            Ver
                                                        </a>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10">
                                            Nenhum candidato contratado encontrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TooltipProvider>
            </CardContent>
        </Card>
    );
};

export default HiredManagement; 