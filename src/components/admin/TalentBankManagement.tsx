import { useState, useMemo } from 'react';
import { useResumes, Resume, useDeleteResume } from '@/hooks/useResumes';
import { useAllJobs } from '@/hooks/useJobs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, FileText, User, Mail, MapPin, Briefcase, Archive, Download, Trash2, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const TalentBankManagement = () => {
    const { data: resumes = [], isLoading: isLoadingResumes, error: resumesError } = useResumes();
    const { data: allJobs = [], isLoading: isLoadingJobs, error: jobsError } = useAllJobs();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        position: 'all',
        state: 'all',
        city: 'all',
    });
    const deleteResume = useDeleteResume();
    const { toast } = useToast();

    const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null);

    const handleExportCSV = () => {
        const csvRows = [];
        const headers = ['Nome', 'Email', 'Telefone', 'Cargo Desejado', 'Estado', 'Cidade', 'Data de Envio', 'Link do Currículo'];
        csvRows.push(headers.join(','));

        for (const resume of filteredResumes) {
            const row = [
                `"${resume.name || ''}"`,
                `"${resume.email || ''}"`,
                `"${resume.phone || ''}"`,
                `"${resume.position || 'N/A'}"`,
                `"${resume.state || ''}"`,
                `"${resume.city || ''}"`,
                `"${new Date(resume.submitted_date).toLocaleDateString('pt-BR')}"`,
                `"${resume.resume_file_url || ''}"`
            ];
            csvRows.push(row.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'relatorio_banco_de_talentos.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const talentBankJobId = useMemo(() => {
        const talentJob = allJobs.find(job => job.title === "Banco de Talentos");
        return talentJob ? talentJob.id : null;
    }, [allJobs]);

    const { uniquePositions, uniqueStates, uniqueCities } = useMemo(() => {
        const validResumes = resumes.filter(r => r && typeof r === 'object');
        return {
            uniquePositions: [...new Set(validResumes.map(r => r.position).filter(Boolean))] as string[],
            uniqueStates: [...new Set(validResumes.map(r => r.state).filter(Boolean))] as string[],
            uniqueCities: [...new Set(validResumes.filter(r => filters.state === 'all' || r.state === filters.state).map(r => r.city).filter(Boolean))] as string[],
        };
    }, [resumes, filters.state]);

    const filteredResumes = useMemo(() => {
        return resumes
            .filter(r => {
                if (!r) return false;
                const searchLower = searchTerm.toLowerCase();
                return (
                    r.name?.toLowerCase().includes(searchLower) ||
                    r.email?.toLowerCase().includes(searchLower) ||
                    r.position?.toLowerCase().includes(searchLower) ||
                    r.skills?.some(skill => skill.toLowerCase().includes(searchLower))
                );
            })
            .filter(r => filters.position !== 'all' ? r.position === filters.position : true)
            .filter(r => filters.state !== 'all' ? r.state === filters.state : true)
            .filter(r => filters.city !== 'all' ? r.city === filters.city : true);
    }, [resumes, searchTerm, filters]);

    const isLoading = isLoadingResumes || isLoadingJobs;
    const error = resumesError || jobsError;

    const handleConfirmDelete = () => {
        if (!resumeToDelete) return;

        deleteResume.mutate(resumeToDelete, {
            onSuccess: () => {
                toast({ title: "Talento excluído com sucesso!" });
                setResumeToDelete(null);
            },
            onError: (error) => {
                toast({ title: "Erro ao excluir talento", description: error.message, variant: "destructive" });
                setResumeToDelete(null);
            },
        });
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-cgb-primary" /> <span className="ml-2">Carregando talentos...</span></div>;
    }

    if (error) {
        return <div className="text-red-600 p-4 bg-red-50 rounded-md">Erro ao carregar dados: {error.message}</div>;
    }

    if (!talentBankJobId) {
        return (
            <Card className="elegant-shadow bg-white border-cgb-silver/30">
                <CardHeader>
                    <CardTitle className="text-cgb-blue flex items-center">
                        <Archive className="w-6 h-6 mr-2 text-cgb-blue" />
                        Banco de Talentos
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-20">
                    <p className="text-lg text-gray-600">A vaga "Banco de Talentos" ainda não foi criada.</p>
                    <p className="text-sm text-gray-500 mt-2">Por favor, vá para "Gestão de Vagas" e crie a vaga para começar a usar este recurso.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Archive className="w-6 h-6 text-cgb-primary" />
                                <span>Banco de Talentos</span>
                            </CardTitle>
                            <div className="space-y-1 mt-2">
                                <p className="text-gray-500">Gerencie currículos enviados para futuras oportunidades.</p>
                                <div className="flex items-center gap-2 text-sm">
                                    <Archive className="w-4 h-4 text-green-500" />
                                    <span className="text-green-600 font-medium">
                                        Visualização completa: Todos os talentos de todas as regiões
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="relative mt-4 md:mt-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                placeholder="Buscar por nome, e-mail, cargo ou habilidade..."
                                className="pl-10 w-full md:w-80"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 pt-4">
                        <Select value={filters.position} onValueChange={value => setFilters(prev => ({ ...prev, position: value }))}>
                            <SelectTrigger><Briefcase className="w-4 h-4 mr-2" /> <span>{filters.position === 'all' ? 'Todos os Cargos' : filters.position}</span></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Cargos</SelectItem>
                                {uniquePositions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filters.state} onValueChange={value => setFilters(prev => ({ ...prev, state: value, city: 'all' }))}>
                            <SelectTrigger><MapPin className="w-4 h-4 mr-2" /> <span>{filters.state === 'all' ? 'Todos os Estados' : filters.state}</span></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Estados</SelectItem>
                                {uniqueStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filters.city} onValueChange={value => setFilters(prev => ({ ...prev, city: value }))}>
                            <SelectTrigger><MapPin className="w-4 h-4 mr-2" /> <span>{filters.city === 'all' ? 'Todas as Cidades' : filters.city}</span></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Cidades</SelectItem>
                                {uniqueCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleExportCSV}
                            className="bg-cgb-primary hover:bg-cgb-primary-dark text-white"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Exportar CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Candidato</TableHead>
                                    <TableHead>Contato</TableHead>
                                    <TableHead>Cargo Desejado</TableHead>
                                    <TableHead>Data de Envio</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredResumes.length > 0 ? (
                                    filteredResumes.map(resume => (
                                        <TableRow key={resume.id}>
                                            <TableCell className="font-medium">{resume.name || 'N/A'}</TableCell>
                                            <TableCell>{resume.email}</TableCell>
                                            <TableCell>{resume.position || 'N/A'}</TableCell>
                                            <TableCell>{new Date(resume.submitted_date).toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" asChild disabled={!resume.resume_file_url}>
                                                    <a href={resume.resume_file_url!} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4 mr-2" />Baixar</a>
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setResumeToDelete(resume)}>
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            Nenhum talento no banco de dados ainda.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="pt-4 text-sm text-gray-600">
                        Mostrando {filteredResumes.length} de {resumes.length} talentos.
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!resumeToDelete} onOpenChange={() => setResumeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação excluirá permanentemente o currículo de "{resumeToDelete?.name}" do banco de talentos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} disabled={deleteResume.isPending}>
                            {deleteResume.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default TalentBankManagement; 