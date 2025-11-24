import { useState, useMemo, useEffect, useRef } from 'react';
import { useCandidates, useDeleteCandidate, Candidate } from '@/hooks/useCandidates';
import { useAllJobs } from '@/hooks/useJobs';
import { useRHProfile } from '@/hooks/useRH';
import { useAuth } from '@/hooks/useAuth';
import { useInviteCandidate } from '@/hooks/useInviteCandidate';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Search, FileText, MapPin, Briefcase, Users, Trash2, UserPlus, Send, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { ResumeButton } from './ResumeButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SELECTION_STATUSES, STATUS_COLORS, SelectionStatus } from '@/lib/constants';
import { useCandidatesCounts } from '@/hooks/useCandidates';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CandidateManagement = () => {
  const { user } = useAuth();
  const { data: rhProfile } = useRHProfile(user?.id);
  const queryClient = useQueryClient();

  // Paginação inteligente
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 50; // 50 candidatos por página para melhor performance

  const { data: jobs = [] } = useAllJobs();
  const deleteCandidate = useDeleteCandidate();
  const inviteCandidate = useInviteCandidate();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all', jobId: 'all', state: 'all', cnh: 'all', vehicle: 'all',
  });

  // Ref para rastrear o filtro de vaga anterior e detectar mudanças
  const previousJobIdRef = useRef<string>('all');

  // 🔥 CORREÇÃO: Passar filtro de vaga para o hook aplicar no servidor
  // MOVIDO PARA DEPOIS da declaração de filters para evitar erro de inicialização
  const { data: candidatesData, isLoading, error } = useCandidates(
    currentPage, 
    pageSize, 
    { jobId: filters.jobId !== 'all' ? filters.jobId : null }
  );
  const candidates = candidatesData?.candidates || [];
  const totalCount = candidatesData?.totalCount || 0;
  const totalPages = candidatesData?.totalPages || 0;
  const hasMore = candidatesData?.hasMore || false;
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [candidateToInvite, setCandidateToInvite] = useState<Candidate | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [isInviting, setIsInviting] = useState(false);

  const talentBankJobId = useMemo(() => jobs.find(job => job.title === "Banco de Talentos")?.id, [jobs]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll para o topo da lista quando mudar de página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 🔥 CORREÇÃO CRÍTICA: Resetar paginação e invalidar cache quando filtro de vaga mudar
  // Isso garante que ao filtrar por vaga, os candidatos apareçam imediatamente na página 1
  useEffect(() => {
    const jobIdChanged = previousJobIdRef.current !== filters.jobId;
    
    if (jobIdChanged) {
      console.log('🔄 [CandidateManagement] Filtro de vaga mudou:', {
        anterior: previousJobIdRef.current,
        novo: filters.jobId
      });
      
      // 1. Resetar página para 0 ANTES de invalidar
      setCurrentPage(0);
      
      // 2. Invalidar todas as queries de candidatos para forçar refetch
      queryClient.invalidateQueries({ 
        queryKey: ['candidates', 'paginated'],
        refetchType: 'active' // Refetch apenas queries ativas
      });
      
      // 3. Atualizar referência
      previousJobIdRef.current = filters.jobId;
      
      // 4. Scroll para o topo
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [filters.jobId, queryClient]);

  // Resetar paginação para outros filtros também
  useEffect(() => {
    // Apenas resetar página se não for mudança de jobId (já tratado acima)
    if (previousJobIdRef.current === filters.jobId) {
    setCurrentPage(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [filters.status, filters.state, filters.cnh, filters.vehicle, searchTerm]);

  // Totais do sistema (não paginados) para exibir nos cards
  const { data: totalCounts } = useCandidatesCounts();

  const filteredCandidates = useMemo(() => {
    console.log('🔄 [filteredCandidates] Recalculando para página:', currentPage + 1, 'com', candidates.length, 'candidatos');

    if (!Array.isArray(candidates)) return [];

    let result = candidates;

    // 1. CORREÇÃO: Filtrar Banco de Talentos APENAS para recrutadores
    // Admins devem ver TODOS os candidatos (incluindo Banco de Talentos)
    if (filters.jobId === 'all' && rhProfile && !rhProfile.is_admin) {
      result = result.filter(c => c.job_id !== talentBankJobId);
    }

    // 2. BUG FIX: Filtro de região para RECRUTADOR (reativado e corrigido)
    if (rhProfile && rhProfile.role === 'recruiter') {
      const assignedStates = rhProfile.assigned_states || [];
      const assignedCities = rhProfile.assigned_cities || [];

      if (assignedStates.length > 0 || assignedCities.length > 0) {
        result = result.filter(candidate => {
          const candidateState = candidate.state || candidate.job?.state;
          const candidateCity = candidate.city || candidate.job?.city;

          // Se não tem estado/cidade definido, não deve aparecer para recrutador com filtro
          if (!candidateState && assignedStates.length > 0) return false;
          if (!candidateCity && assignedCities.length > 0) return false;

          // Verifica se bate com os estados E cidades atribuídos
          const matchState = assignedStates.length === 0 || assignedStates.includes(candidateState);
          const matchCity = assignedCities.length === 0 || assignedCities.includes(candidateCity);

          return matchState && matchCity;
        });
      }
    }

    // 3. Filtro de busca por texto - APENAS NOME para recrutador e admin
    if (searchTerm.trim() && rhProfile && (rhProfile.role === 'recruiter' || rhProfile.role === 'admin' || rhProfile.is_admin)) {
      result = result.filter(c => {
        if (!c) return false;
        const searchLower = searchTerm.toLowerCase();
        // Buscar apenas pelo nome do candidato
        const matchName = (c.name || '').toLowerCase().includes(searchLower);
        return matchName;
      });
    }

    // 4. Filtro por status
    if (filters.status !== 'all') {
      result = result.filter(c => c.status === filters.status);
    }

    // 5. Filtro por vaga - REMOVIDO: Agora aplicado no servidor via useCandidates
    // O filtro de vaga já foi aplicado na query do servidor, então não precisa filtrar localmente

    // 6. Filtro por estado
    if (filters.state !== 'all') {
      result = result.filter(c => (c.state || c.job?.state) === filters.state);
    }

    // 7. Filtro CNH
    if (filters.cnh !== 'all') {
      result = result.filter(c => {
        const cnhVal = (c.cnh || '').toLowerCase().trim();

        // Valores que indicam "não possui CNH"
        const naoPossui = !c.cnh || c.cnh === null || cnhVal === '' || cnhVal === 'não possui' || cnhVal === 'nao possui' || cnhVal === 'não possuo' || cnhVal === 'nao possuo';

        if (filters.cnh === 'sim') {
          // Tem CNH: qualquer valor que não seja vazio ou "não possui"
          return !naoPossui;
        } else if (filters.cnh === 'não') {
          // Não tem CNH: valores vazios ou "não possui"
          return naoPossui;
        }
        return true;
      });
    }

    // 8. Filtro Veículo
    if (filters.vehicle !== 'all') {
      result = result.filter(c => {
        const vehicleValue = (c.vehicle || '').toLowerCase().trim();

        if (filters.vehicle === 'nao') {
          return !c.vehicle || vehicleValue === '' || vehicleValue === 'não possuo' || vehicleValue === 'nao possuo';
        }

        return vehicleValue === filters.vehicle;
      });
    }

    console.log('✅ [filteredCandidates] Resultado final:', result.length, 'candidatos filtrados');
    return result;
  }, [candidates, searchTerm, filters, talentBankJobId, rhProfile]);

  const jobsForFilter = useMemo(() => jobs.filter(job => job.id !== talentBankJobId), [jobs, talentBankJobId]);

  const summary = useMemo(() => {
    if (!Array.isArray(filteredCandidates)) return { Total: 0 };

    // Usar apenas os candidatos da página atual (já filtrados)
    const relevantCandidates = filteredCandidates;

    // Contagem por status exato (conforme SELECTION_STATUSES)
    const statusCounts = SELECTION_STATUSES.reduce((acc, status) => {
      acc[status] = relevantCandidates.filter(c => c.status === status).length;
      return acc;
    }, {} as Record<SelectionStatus, number>);

    // Mapeamento para os cards do painel
    const uiSummary = {
      Total: relevantCandidates.length,
      'Análise de Currículo': statusCounts['Análise de Currículo'] || 0,
      // Somar as entrevistas (RH + Gestor) para o card "Em Entrevista"
      'Em Entrevista': (statusCounts['Entrevista com RH'] || 0) + (statusCounts['Entrevista com Gestor'] || 0),
      Aprovado: statusCounts['Aprovado'] || 0,
    } as Record<string, number>;

    console.log('📊 [CandidateManagement] Resumo da página atual:', {
      paginaAtual: currentPage + 1,
      candidatosVisiveis: relevantCandidates.length,
      totalCandidatos: totalCount,
      role: rhProfile?.role,
      isAdmin: rhProfile?.is_admin,
      candidatosOriginais: candidates.length,
      candidatosFiltrados: filteredCandidates.length,
      uiSummary
    });

    return uiSummary;
  }, [filteredCandidates, currentPage, totalCount, rhProfile]);

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

  const handleInviteToJob = async () => {
    if (!candidateToInvite || !selectedJobId) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione uma vaga para o convite.",
        variant: "destructive"
      });
      return;
    }

    setIsInviting(true);

    try {
      await inviteCandidate.mutateAsync({
        candidateId: candidateToInvite.id,
        newJobId: selectedJobId,
        candidateName: candidateToInvite.name
      });

      setCandidateToInvite(null);
      setSelectedJobId('');
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-cgb-primary" /> <span className="ml-2">Carregando...</span></div>;
  if (error) return <div className="text-red-600 p-4 bg-red-50 rounded-md">Erro ao carregar candidatos: {error.message}</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users /> Painel de Candidatos</CardTitle>
          <p className="text-gray-500">Gerencie todos os candidatos que se aplicaram às vagas.</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <p className="text-sm text-blue-700">
              <strong>📋 Visualização:</strong> Este painel é apenas para consulta. Para alterar o status dos candidatos,
              utilize a seção <strong>"Processos Seletivos"</strong> no menu lateral.
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700">Total de Candidatos</h3>
            <p className="text-3xl font-bold">{totalCounts?.total ?? summary.Total ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Total no sistema</p>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-700">Análise de Currículo</h3>
            <p className="text-3xl font-bold text-blue-800">{totalCounts?.analise ?? summary['Análise de Currículo'] ?? 0}</p>
            <p className="text-xs text-blue-600 mt-1">Total no sistema</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-700">Em Entrevista</h3>
            <p className="text-3xl font-bold text-purple-800">{totalCounts?.entrevista ?? summary['Em Entrevista'] ?? 0}</p>
            <p className="text-xs text-purple-600 mt-1">Total no sistema</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-700">Aprovados</h3>
            <p className="text-3xl font-bold text-green-800">{totalCounts?.aprovado ?? summary.Aprovado ?? 0}</p>
            <p className="text-xs text-green-600 mt-1">Total no sistema</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Busca por nome - apenas para recrutador e admin */}
            {rhProfile && (rhProfile.role === 'recruiter' || rhProfile.role === 'admin' || rhProfile.is_admin) ? (
              <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="h-10 w-10 p-0"
                    onClick={() => setIsSearchOpen(true)}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="start">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Buscar candidato por nome</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Digite o nome do candidato..."
                        value={searchTerm}
                        onChange={(e) => {
                          console.log('🔍 [CandidateManagement] Busca alterada:', e.target.value);
                          setSearchTerm(e.target.value);
                        }}
                        className="pl-10"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setIsSearchOpen(false);
                          }
                        }}
                      />
                    </div>
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => {
                          setSearchTerm('');
                          setIsSearchOpen(false);
                        }}
                      >
                        Limpar busca
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            ) : null}
            <Select value={filters.jobId} onValueChange={value => setFilters(prev => ({ ...prev, jobId: value }))}><SelectTrigger><Briefcase className="w-4 h-4 mr-2" /> <span>{filters.jobId === 'all' ? 'Todas as Vagas' : (() => {
              const selectedJob = jobs.find(j => j.id === filters.jobId);
              return selectedJob ? `${selectedJob.title} - ${selectedJob.city}, ${selectedJob.state}` : 'Vaga';
            })()}</span></SelectTrigger><SelectContent><SelectItem value="all">Todas as Vagas</SelectItem>{jobsForFilter.map(job => <SelectItem key={job.id} value={job.id}>{job.title} - {job.city}, {job.state}</SelectItem>)}</SelectContent></Select>
            <Select value={filters.status} onValueChange={value => setFilters(prev => ({ ...prev, status: value }))}><SelectTrigger><span>{filters.status === 'all' ? 'Todos os Status' : filters.status}</span></SelectTrigger><SelectContent><SelectItem value="all">Todos os Status</SelectItem>{SELECTION_STATUSES.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent></Select>
            <Select value={filters.state} onValueChange={value => setFilters(prev => ({ ...prev, state: value }))}><SelectTrigger><MapPin className="w-4 h-4 mr-2" /> <span>{filters.state === 'all' ? 'Todos os Estados' : filters.state}</span></SelectTrigger><SelectContent><SelectItem value="all">Todos os Estados</SelectItem>{uniqueStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}</SelectContent></Select>
            <Select value={filters.cnh} onValueChange={value => setFilters(prev => ({ ...prev, cnh: value }))}><SelectTrigger><span>Possui CNH?</span></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="sim">Sim</SelectItem><SelectItem value="não">Não</SelectItem></SelectContent></Select>
            <Select value={filters.vehicle} onValueChange={value => setFilters(prev => ({ ...prev, vehicle: value }))}><SelectTrigger><span>Tipo de Veículo</span></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="carro">Carro</SelectItem><SelectItem value="moto">Moto</SelectItem><SelectItem value="nao">Não possuo</SelectItem></SelectContent></Select>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Candidato</TableHead><TableHead>Vaga Aplicada</TableHead><TableHead>Localização</TableHead><TableHead>Currículo</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredCandidates && filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate, index) => {
                    if (!candidate) return null;
                    const currentStatus = (candidate.status && SELECTION_STATUSES.includes(candidate.status as any)) ? candidate.status as SelectionStatus : 'Cadastrado';
                    const statusColor = STATUS_COLORS[currentStatus] || "bg-gray-200 text-gray-800";
                    return (
                      <TableRow key={`candidate-${candidate.id || index}`}>
                        <TableCell><div className="font-medium">{candidate.name || 'Nome não informado'}</div><div className="text-sm text-gray-500">{candidate.email || 'E-mail não informado'}</div></TableCell>
                        <TableCell>{candidate.job?.title || candidate.desiredJob || 'N/A'}</TableCell>
                        <TableCell>{`${candidate.city || candidate.job?.city || 'Cidade não informada'}, ${candidate.state || candidate.job?.state || ''}`}</TableCell>
                        <TableCell><ResumeButton candidate={candidate} /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {currentStatus === 'Aprovado' && candidate.legal_validation_comment && candidate.legal_validation_comment.trim() !== '' ? (
                              <TooltipProvider>
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
                              </TooltipProvider>
                            ) : (
                              <Badge className={`${statusColor} border-none font-semibold`}>
                                {currentStatus}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCandidateToInvite(candidate)}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Convidar
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setCandidateToDelete(candidate)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center h-24">
                    Nenhum candidato encontrado com os filtros selecionados.
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para Convite para Nova Vaga */}
      <Dialog open={!!candidateToInvite} onOpenChange={() => setCandidateToInvite(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Convidar para Nova Vaga
            </DialogTitle>
            <DialogDescription>
              Convide <strong>{candidateToInvite?.name}</strong> para se candidatar a uma nova vaga.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Selecione a Nova Vaga:</label>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Escolha uma vaga..." />
                </SelectTrigger>
                <SelectContent>
                  {jobsForFilter.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{job.title}</span>
                        <span className="text-xs text-gray-500">
                          {job.city}, {job.state}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedJobId && candidateToInvite && (
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">Prévia do Convite:</h4>
                <p className="text-sm text-blue-800">
                  <strong>{candidateToInvite.name}</strong> será convidado(a) para se candidatar à vaga
                  <strong> {jobsForFilter.find(j => j.id === selectedJobId)?.title}</strong>.
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  📋 O candidato será transferido para o processo seletivo da nova vaga.
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  ⚠️ Esta ação alterará o status atual do candidato.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCandidateToInvite(null)}>
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

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-6 py-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            Mostrando {currentPage * pageSize + 1} a {Math.min((currentPage + 1) * pageSize, totalCount)} de {totalCount} candidatos
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(0)}
              disabled={currentPage === 0}
            >
              Primeira
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>

            <span className="px-3 py-1 text-sm font-medium">
              Página {currentPage + 1} de {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
            >
              Última
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateManagement;
