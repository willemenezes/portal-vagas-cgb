import { useState, useMemo } from 'react';
import { useCandidates, useUpdateCandidateStatus, useDeleteCandidate, Candidate } from '@/hooks/useCandidates';
import { useAllJobs } from '@/hooks/useJobs';
import { useAuth } from '@/hooks/useAuth';
import { useRHProfile } from '@/hooks/useRH';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Download, FileText, User, Mail, MapPin, Briefcase, Users, Trash2, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SELECTION_STATUSES, STATUS_COLORS, SelectionStatus } from '@/lib/constants';
import { useCreateCandidateNote } from '@/hooks/useCandidateNotes';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const CandidateManagement = () => {
  const { user } = useAuth();
  const { data: rhProfile } = useRHProfile(user?.id);
  const { data: candidates = [], isLoading, error } = useCandidates();
  const { data: jobs = [] } = useAllJobs();
  const updateStatus = useUpdateCandidateStatus();
  const createNote = useCreateCandidateNote();
  const deleteCandidate = useDeleteCandidate();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all', jobId: 'all', state: 'all', cnh: 'all', vehicle: 'all',
  });
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);

  const talentBankJobId = useMemo(() => jobs.find(job => job.title === "Banco de Talentos")?.id, [jobs]);

  const handleStatusChange = (candidateId: string, newStatus: SelectionStatus) => {
    updateStatus.mutate({ id: candidateId, status: newStatus }, {
      onSuccess: () => {
        toast({ title: "Status atualizado!", description: `O status do candidato foi alterado para ${newStatus}.` });
        if (user) createNote.mutate({ candidate_id: candidateId, author_id: user.id, note: `Status alterado para "${newStatus}"`, activity_type: 'Mudança de Status' });
      },
      onError: (err: any) => toast({ title: "Erro!", description: `Não foi possível atualizar o status: ${err.message}`, variant: "destructive" }),
    });
  };

  const filteredCandidates = useMemo(() => {
    if (!Array.isArray(candidates)) return [];
    return candidates
      .filter(c => filters.jobId === 'all' ? c.job_id !== talentBankJobId : true)
      .filter(c => {
        if (!rhProfile || rhProfile.is_admin) return true;
        const candidateState = c.state || c.job?.state;
        const candidateCity = c.city || c.job?.city;
        if (rhProfile.assigned_states?.length) return rhProfile.assigned_states.includes(candidateState);
        if (rhProfile.assigned_cities?.length) return rhProfile.assigned_cities.includes(candidateCity);
        return true;
      })
      .filter(c => {
        if (!c) return false;
        const searchLower = searchTerm.toLowerCase();
        return (c.name || '').toLowerCase().includes(searchLower) ||
          (c.email || '').toLowerCase().includes(searchLower) ||
          (c.job?.title || '').toLowerCase().includes(searchLower);
      })
      .filter(c => filters.status !== 'all' ? c.status === filters.status : true)
      .filter(c => filters.jobId !== 'all' ? c.job_id === filters.jobId : true)
      .filter(c => filters.state !== 'all' ? (c.state || c.job?.state) === filters.state : true)
      .filter(c => filters.cnh === 'all' ? true : (c.cnh && c.cnh.toLowerCase() !== 'não possuo') === (filters.cnh === 'sim'))
      .filter(c => {
        if (filters.vehicle === 'all') return true;
        const vehicleValue = c.vehicle?.toLowerCase() || '';
        if (filters.vehicle === 'nao') return vehicleValue === 'não possuo';
        return vehicleValue === filters.vehicle;
      });
  }, [candidates, searchTerm, filters, talentBankJobId, rhProfile]);

  const handleExportCSV = () => {
    const csvRows = [];
    const headers = ['Nome', 'Email', 'Telefone', 'Vaga Aplicada', 'Status', 'Localização', 'Possui CNH', 'Tipo de Veículo', 'Link do Currículo'];
    csvRows.push(headers.join(','));

    for (const candidate of filteredCandidates) {
      const row = [
        `"${candidate.name || ''}"`,
        `"${candidate.email || ''}"`,
        `"${candidate.phone || ''}"`,
        `"${candidate.job?.title || candidate.desiredJob || 'N/A'}"`,
        `"${candidate.status || 'N/A'}"`,
        `"${candidate.city || ''}, ${candidate.state || ''}"`,
        `"${(candidate.cnh && candidate.cnh.toLowerCase() !== 'não possuo') ? 'Sim' : 'Não'}"`,
        `"${candidate.vehicle || 'N/A'}"`,
        `"${candidate.resume_file_url || ''}"`
      ];
      csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'relatorio_candidatos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const jobsForFilter = useMemo(() => jobs.filter(job => job.id !== talentBankJobId), [jobs, talentBankJobId]);

  const summary = useMemo(() => {
    let relevantCandidates = Array.isArray(candidates) ? candidates.filter(c => c.job_id !== talentBankJobId) : [];
    if (rhProfile && !rhProfile.is_admin) {
      relevantCandidates = relevantCandidates.filter(c => {
        const candidateState = c.state || c.job?.state;
        const candidateCity = c.city || c.job?.city;
        if (rhProfile.assigned_states?.length) return rhProfile.assigned_states.includes(candidateState);
        if (rhProfile.assigned_cities?.length) return rhProfile.assigned_cities.includes(candidateCity);
        return true;
      });
    }
    const summaryData = SELECTION_STATUSES.reduce((acc, status) => {
      acc[status] = relevantCandidates.filter(c => c.status === status).length;
      return acc;
    }, {} as Record<SelectionStatus, number>);
    summaryData['Total'] = relevantCandidates.length;
    return summaryData;
  }, [candidates, talentBankJobId, rhProfile]);

  const uniqueStates = useMemo(() => {
    if (!Array.isArray(candidates)) return [];
    return Array.from(new Set(candidates.map(c => c.state || c.job?.state).filter(Boolean))) as string[];
  }, [candidates]);

  const handleConfirmDelete = () => {
    if (!candidateToDelete) return;
    deleteCandidate.mutate(candidateToDelete, {
      onSuccess: () => {
        toast({ title: "Candidato excluído com sucesso!" });
        setCandidateToDelete(null);
      },
      onError: (error) => {
        toast({ title: "Erro ao excluir candidato", description: error.message, variant: "destructive" });
        setCandidateToDelete(null);
      },
    });
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-cgb-primary" /> <span className="ml-2">Carregando...</span></div>;
  if (error) return <div className="text-red-600 p-4 bg-red-50 rounded-md">Erro ao carregar candidatos: {error.message}</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users /> Painel de Candidatos</CardTitle>
          <p className="text-gray-500">Gerencie todos os candidatos que se aplicaram às vagas.</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-100 p-4 rounded-lg"><h3>Total de Candidatos</h3><p className="text-3xl font-bold">{summary.Total || 0}</p></div>
          <div className="bg-blue-100 p-4 rounded-lg"><h3>Análise de Currículo</h3><p className="text-3xl font-bold">{summary['Análise de Currículo'] || 0}</p></div>
          <div className="bg-purple-100 p-4 rounded-lg"><h3>Em Entrevista</h3><p className="text-3xl font-bold">{summary['Em Entrevista'] || 0}</p></div>
          <div className="bg-green-100 p-4 rounded-lg"><h3>Aprovados</h3><p className="text-3xl font-bold">{summary.Aprovado || 0}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input placeholder="Buscar por nome, e-mail ou cargo..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
            <Select value={filters.jobId} onValueChange={value => setFilters(prev => ({ ...prev, jobId: value }))}><SelectTrigger><Briefcase className="w-4 h-4 mr-2" /> <span>{filters.jobId === 'all' ? 'Todas as Vagas' : (jobs.find(j => j.id === filters.jobId)?.title || 'Vaga')}</span></SelectTrigger><SelectContent><SelectItem value="all">Todas as Vagas</SelectItem>{jobsForFilter.map(job => <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>)}</SelectContent></Select>
            <Select value={filters.status} onValueChange={value => setFilters(prev => ({ ...prev, status: value }))}><SelectTrigger><span>{filters.status === 'all' ? 'Todos os Status' : filters.status}</span></SelectTrigger><SelectContent><SelectItem value="all">Todos os Status</SelectItem>{SELECTION_STATUSES.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent></Select>
            <Select value={filters.state} onValueChange={value => setFilters(prev => ({ ...prev, state: value }))}><SelectTrigger><MapPin className="w-4 h-4 mr-2" /> <span>{filters.state === 'all' ? 'Todos os Estados' : filters.state}</span></SelectTrigger><SelectContent><SelectItem value="all">Todos os Estados</SelectItem>{uniqueStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}</SelectContent></Select>
            <Select value={filters.cnh} onValueChange={value => setFilters(prev => ({ ...prev, cnh: value }))}><SelectTrigger><span>Possui CNH?</span></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="sim">Sim</SelectItem><SelectItem value="não">Não</SelectItem></SelectContent></Select>
            <Select value={filters.vehicle} onValueChange={value => setFilters(prev => ({ ...prev, vehicle: value }))}><SelectTrigger><span>Tipo de Veículo</span></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="carro">Carro</SelectItem><SelectItem value="moto">Moto</SelectItem><SelectItem value="nao">Não possuo</SelectItem></SelectContent></Select>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleExportCSV} className="bg-cgb-primary hover:bg-cgb-primary-dark text-white">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar para CSV
            </Button>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Candidato</TableHead><TableHead>Vaga Aplicada</TableHead><TableHead>Localização</TableHead><TableHead>Currículo</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map(candidate => {
                    if (!candidate) return null;
                    const currentStatus = (candidate.status && SELECTION_STATUSES.includes(candidate.status as any)) ? candidate.status as SelectionStatus : 'Cadastrado';
                    const statusColor = STATUS_COLORS[currentStatus] || "bg-gray-200 text-gray-800";
                    return (
                      <TableRow key={candidate.id}>
                        <TableCell><div className="font-medium">{candidate.name || 'Nome não informado'}</div><div className="text-sm text-gray-500">{candidate.email || 'E-mail não informado'}</div></TableCell>
                        <TableCell>{candidate.job?.title || candidate.desiredJob || 'N/A'}</TableCell>
                        <TableCell>{`${candidate.city || candidate.job?.city || 'Cidade não informada'}, ${candidate.state || candidate.job?.state || ''}`}</TableCell>
                        <TableCell><Button variant="outline" size="sm" asChild disabled={!candidate.resume_file_url}><a href={candidate.resume_file_url || '#'} target="_blank" rel="noopener noreferrer"><FileText className="w-4 h-4 mr-2" />Ver</a></Button></TableCell>
                        <TableCell>
                          <Select value={currentStatus} onValueChange={(value) => handleStatusChange(candidate.id, value as SelectionStatus)} disabled={updateStatus.isPending}>
                            <SelectTrigger className={`${statusColor} border-none font-semibold rounded-md text-xs h-auto py-1 px-2`}><SelectValue /></SelectTrigger>
                            <SelectContent>{SELECTION_STATUSES.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setCandidateToDelete(candidate)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center h-24">Nenhum candidato encontrado com os filtros selecionados.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!candidateToDelete} onOpenChange={() => setCandidateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Isso excluirá permanentemente o candidato "{candidateToDelete?.name}" e todos os seus dados.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleteCandidate.isPending}>
              {deleteCandidate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CandidateManagement;
