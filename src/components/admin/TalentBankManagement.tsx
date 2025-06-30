import { useState, useMemo } from 'react';
import { useResumes, Resume, useDeleteResume } from '@/hooks/useResumes';
import { useAllJobs } from '@/hooks/useJobs';
import { useCreateCandidate, useCandidates } from '@/hooks/useCandidates';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, FileText, User, Mail, MapPin, Briefcase, Archive, Download, Trash2, FileSpreadsheet, UserPlus, Send, Eye, EyeOff, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const TalentBankManagement = () => {
    const { data: resumes = [], isLoading: isLoadingResumes, error: resumesError } = useResumes();
    const { data: allJobs = [], isLoading: isLoadingJobs, error: jobsError } = useAllJobs();
    const { data: candidates = [] } = useCandidates();
    const createCandidate = useCreateCandidate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        position: 'all',
        state: 'all',
        city: 'all',
    });
    const [showInvited, setShowInvited] = useState(false); // Controle para mostrar/ocultar convidados
    const deleteResume = useDeleteResume();
    const { toast } = useToast();

    const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null);
    const [resumeToInvite, setResumeToInvite] = useState<Resume | null>(null);
    const [selectedJobId, setSelectedJobId] = useState<string>('');
    const [isInviting, setIsInviting] = useState(false);

    const talentBankJobId = useMemo(() => {
        const talentJob = allJobs.find(job => job.title === "Banco de Talentos");
        return talentJob ? talentJob.id : null;
    }, [allJobs]);

    // Filtrar vagas ativas (excluindo Banco de Talentos)
    const availableJobs = useMemo(() => {
        return allJobs.filter(job =>
            job.status === 'active' &&
            job.title !== "Banco de Talentos"
        );
    }, [allJobs]);

    // Identificar emails que já foram convidados para vagas
    const invitedEmails = useMemo(() => {
        return new Set(
            candidates
                .filter(candidate => candidate.status === 'Convidado')
                .map(candidate => candidate.email.toLowerCase())
        );
    }, [candidates]);

    // Contar quantos talentos estão em processo ativo
    const invitedCount = useMemo(() => {
        return resumes.filter(resume =>
            invitedEmails.has(resume.email.toLowerCase())
        ).length;
    }, [resumes, invitedEmails]);

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

                // Filtro para mostrar/ocultar convidados
                const isInvited = invitedEmails.has(r.email.toLowerCase());
                if (!showInvited && isInvited) return false;

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
    }, [resumes, searchTerm, filters, showInvited, invitedEmails]);

    const isLoading = isLoadingResumes || isLoadingJobs;
    const error = resumesError || jobsError;

    // Função para sugerir vagas compatíveis
    const getCompatibleJobs = (resume: Resume) => {
        return availableJobs.filter(job => {
            // Compatibilidade por localização
            const locationMatch = job.state === 'Todos' ||
                job.state === resume.state ||
                job.city === resume.city;

            // Compatibilidade por cargo (busca parcial)
            const positionMatch = !resume.position ||
                job.title.toLowerCase().includes(resume.position.toLowerCase()) ||
                job.department.toLowerCase().includes(resume.position.toLowerCase()) ||
                resume.position.toLowerCase().includes(job.title.toLowerCase());

            return locationMatch || positionMatch;
        });
    };

    // Verificar se o talento já foi convidado
    const isResumeInvited = (resume: Resume) => {
        return invitedEmails.has(resume.email.toLowerCase());
    };

    // Obter informações do processo ativo
    const getActiveProcessInfo = (resume: Resume) => {
        const candidate = candidates.find(c =>
            c.email.toLowerCase() === resume.email.toLowerCase() &&
            c.status === 'Convidado'
        );
        if (candidate && candidate.job) {
            return {
                jobTitle: candidate.job.title,
                status: candidate.status
            };
        }
        return null;
    };

    const handleInviteToJob = async () => {
        if (!resumeToInvite || !selectedJobId) {
            toast({
                title: "Campos obrigatórios",
                description: "Por favor, selecione uma vaga para o convite.",
                variant: "destructive"
            });
            return;
        }

        setIsInviting(true);

        try {
            const selectedJob = availableJobs.find(j => j.id === selectedJobId);

            // Criar candidatura na tabela candidates
            const candidateData = {
                name: resumeToInvite.name || '',
                email: resumeToInvite.email,
                phone: resumeToInvite.phone || '',
                city: resumeToInvite.city || selectedJob?.city || '',
                state: resumeToInvite.state || selectedJob?.state || '',
                job_id: selectedJobId,
                status: 'Convidado' as any, // Status especial para convites
                resume_file_url: resumeToInvite.resume_file_url,
                resume_file_name: resumeToInvite.resume_file_name,
                applied_date: new Date().toISOString(),
                // Campos adicionais baseados no currículo
                desiredJob: resumeToInvite.position || selectedJob?.title || '',
                age: '', // Não disponível no banco de talentos
                workedAtCGB: '', // Não disponível no banco de talentos
                whatsapp: resumeToInvite.phone || '',
                emailInfo: resumeToInvite.email,
                pcd: '', // Não disponível no banco de talentos
                travel: '', // Não disponível no banco de talentos
                cnh: '', // Não disponível no banco de talentos
                vehicle: '', // Não disponível no banco de talentos
                vehicleModel: '', // Não disponível no banco de talentos
                vehicleYear: '', // Não disponível no banco de talentos
                lgpdConsent: true // Assumir consentimento já dado no banco de talentos
            };

            await createCandidate.mutateAsync(candidateData);

            toast({
                title: "Convite enviado com sucesso!",
                description: `${resumeToInvite.name} foi transferido(a) para a vaga "${selectedJob?.title}".`,
                duration: 5000
            });

            // TODO: Implementar envio de email/WhatsApp automático

            setResumeToInvite(null);
            setSelectedJobId('');

        } catch (error: any) {
            toast({
                title: "Erro ao enviar convite",
                description: error.message || "Tente novamente mais tarde.",
                variant: "destructive"
            });
        } finally {
            setIsInviting(false);
        }
    };

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
                        Cadastro de Currículos
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-20">
                    <p className="text-lg text-gray-600">A vaga "Cadastro de Currículos" ainda não foi criada.</p>
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
                                <span>Cadastro de Currículos</span>
                            </CardTitle>
                            <div className="space-y-1 mt-2">
                                <p className="text-gray-500">Gerencie currículos enviados para futuras oportunidades.</p>
                                <div className="flex items-center gap-2 text-sm">
                                    <Archive className="w-4 h-4 text-green-500" />
                                    <span className="text-green-600 font-medium">
                                        {filteredResumes.length} talentos disponíveis
                                    </span>
                                </div>
                                {availableJobs.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <UserPlus className="w-4 h-4 text-blue-500" />
                                        <span className="text-blue-600 font-medium">
                                            {availableJobs.length} vagas ativas disponíveis para convites
                                        </span>
                                    </div>
                                )}
                                {invitedCount > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Filter className="w-4 h-4 text-orange-500" />
                                        <span className="text-orange-600 font-medium">
                                            {invitedCount} talentos em processo seletivo ativo
                                        </span>
                                    </div>
                                )}
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

                    {/* Controles de Filtro */}
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

                        {/* Toggle para mostrar/ocultar convidados */}
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md border">
                            {showInvited ? <Eye className="w-4 h-4 text-gray-600" /> : <EyeOff className="w-4 h-4 text-gray-600" />}
                            <span className="text-sm font-medium">Mostrar em processo</span>
                            <Switch
                                checked={showInvited}
                                onCheckedChange={setShowInvited}
                            />
                        </div>
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
                                    filteredResumes.map((resume) => {
                                        const compatibleJobs = getCompatibleJobs(resume);
                                        const isInvited = isResumeInvited(resume);
                                        const processInfo = getActiveProcessInfo(resume);

                                        return (
                                            <TableRow key={resume.id} className={isInvited ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <span>{resume.name || 'N/A'}</span>
                                                        {isInvited && (
                                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                                                Em Processo
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{resume.email}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span>{resume.position || 'N/A'}</span>
                                                        {isInvited && processInfo ? (
                                                            <Badge variant="outline" className="text-xs mt-1 w-fit bg-blue-50 text-blue-600 border-blue-200">
                                                                📋 {processInfo.jobTitle}
                                                            </Badge>
                                                        ) : (
                                                            compatibleJobs.length > 0 && (
                                                                <Badge variant="outline" className="text-xs mt-1 w-fit">
                                                                    {compatibleJobs.length} vaga{compatibleJobs.length > 1 ? 's' : ''} compatível{compatibleJobs.length > 1 ? 'eis' : ''}
                                                                </Badge>
                                                            )
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{new Date(resume.submitted_date).toLocaleDateString('pt-BR')}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        {!isInvited && availableJobs.length > 0 && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setResumeToInvite(resume)}
                                                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                                            >
                                                                <UserPlus className="w-4 h-4 mr-1" />
                                                                Convidar
                                                            </Button>
                                                        )}
                                                        <Button variant="outline" size="sm" asChild disabled={!resume.resume_file_url}>
                                                            <a href={resume.resume_file_url!} target="_blank" rel="noopener noreferrer">
                                                                <Download className="w-4 h-4 mr-2" />Baixar
                                                            </a>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => setResumeToDelete(resume)}>
                                                            <Trash2 className="w-4 h-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            {!showInvited && invitedCount > 0 ? (
                                                <div className="text-center">
                                                    <p>Nenhum talento disponível com os filtros selecionados.</p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {invitedCount} talento{invitedCount > 1 ? 's estão' : ' está'} em processo seletivo.
                                                        <Button
                                                            variant="link"
                                                            className="p-0 h-auto ml-1"
                                                            onClick={() => setShowInvited(true)}
                                                        >
                                                            Mostrar todos
                                                        </Button>
                                                    </p>
                                                </div>
                                            ) : (
                                                "Nenhum talento no banco de dados ainda."
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="pt-4 text-sm text-gray-600">
                        Mostrando {filteredResumes.length} de {resumes.length} talentos.
                        {!showInvited && invitedCount > 0 && (
                            <span className="ml-2 text-blue-600">
                                ({invitedCount} oculto{invitedCount > 1 ? 's' : ''} - em processo)
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Dialog para Convite para Vaga */}
            <Dialog open={!!resumeToInvite} onOpenChange={() => setResumeToInvite(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-blue-600" />
                            Convidar para Vaga
                        </DialogTitle>
                        <DialogDescription>
                            Convide <strong>{resumeToInvite?.name}</strong> para se candidatar a uma vaga específica.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Selecione a Vaga:</label>
                            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                                <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Escolha uma vaga..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableJobs.map(job => {
                                        const isCompatible = resumeToInvite ? getCompatibleJobs(resumeToInvite).some(j => j.id === job.id) : false;
                                        return (
                                            <SelectItem key={job.id} value={job.id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{job.title}</span>
                                                    {isCompatible && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Compatível
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {job.city}, {job.state}
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedJobId && resumeToInvite && (
                            <div className="bg-blue-50 p-3 rounded-md">
                                <h4 className="font-medium text-blue-900 mb-2">Prévia do Convite:</h4>
                                <p className="text-sm text-blue-800">
                                    <strong>{resumeToInvite.name}</strong> será convidado(a) para se candidatar à vaga
                                    <strong> {availableJobs.find(j => j.id === selectedJobId)?.title}</strong>.
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    ✉️ Um email será enviado automaticamente com o convite.
                                </p>
                                <p className="text-xs text-orange-600 mt-1">
                                    📋 O talento será transferido para o processo seletivo da vaga.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResumeToInvite(null)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleInviteToJob}
                            disabled={!selectedJobId || isInviting}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isInviting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Enviar Convite
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog de Confirmação de Exclusão */}
            <AlertDialog open={!!resumeToDelete} onOpenChange={() => setResumeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação excluirá permanentemente o currículo de "{resumeToDelete?.name}" do sistema.
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