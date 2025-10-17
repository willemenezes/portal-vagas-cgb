import { useState, useMemo } from 'react';
import { useCandidates, useUpdateCandidateStatus } from '@/hooks/useCandidates';
import { useAuth } from '@/hooks/useAuth';
import { useRHProfile } from '@/hooks/useRH';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Briefcase, MapPin, Download, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SELECTION_STATUSES, STATUS_COLORS, SelectionStatus } from '@/lib/constants';
import { useCreateCandidateNote } from '@/hooks/useCandidateNotes';

const ResumeManagement = () => {
  const { user } = useAuth();
  const { data: rhProfile } = useRHProfile(user?.id);
  const { data: candidatesData, isLoading, error } = useCandidates();
  const candidates = candidatesData?.candidates || [];
  const updateStatus = useUpdateCandidateStatus();
  const createNote = useCreateCandidateNote();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    position: 'all',
    state: 'all',
    city: 'all'
  });

  const handleStatusChange = (candidateId: string, newStatus: SelectionStatus) => {
    updateStatus.mutate({ id: candidateId, status: newStatus }, {
      onSuccess: () => {
        toast({
          title: "Status atualizado!",
          description: `O status do candidato foi alterado para ${newStatus}.`,
        });

        if (user) {
          createNote.mutate({
            candidate_id: candidateId,
            author_id: user.id,
            note: `Status alterado para "${newStatus}" (via Painel de Currículos)`,
            activity_type: 'Mudança de Status',
          });
        }
      },
      onError: (err: any) => {
        toast({
          title: "Erro!",
          description: `Não foi possível atualizar o status: ${err.message}`,
          variant: "destructive"
        });
      }
    });
  };

  const filteredCandidates = useMemo(() => {
    return candidates
      // Filtro por região do usuário RH - REMOVIDO para evitar problemas
      // .filter(c => { ... })
      .filter(candidate => {
        if (!candidate) return false;
        const searchLower = searchTerm.toLowerCase();
        const name = candidate.name || '';
        const email = candidate.email || '';
        const position = candidate.desiredJob || '';

        return (
          name.toLowerCase().includes(searchLower) ||
          email.toLowerCase().includes(searchLower) ||
          position.toLowerCase().includes(searchLower)
        );
      })
      .filter(c => filters.status !== 'all' ? c.status === filters.status : true)
      .filter(c => filters.position !== 'all' ? c.desiredJob === filters.position : true)
      .filter(c => filters.state !== 'all' ? c.state === filters.state : true)
      .filter(c => filters.city !== 'all' ? c.city === filters.city : true);
  }, [candidates, searchTerm, filters, rhProfile]);

  const { uniquePositions, uniqueStates, uniqueCities } = useMemo(() => {
    const validCandidates = candidates.filter(c => c && typeof c === 'object');
    return {
      uniquePositions: [...new Set(validCandidates.map(c => c.desiredJob).filter(Boolean))],
      uniqueStates: [...new Set(validCandidates.map(c => c.state).filter(Boolean))],
      uniqueCities: [...new Set(validCandidates.filter(c => filters.state === 'all' || c.state === filters.state).map(c => c.city).filter(Boolean))]
    };
  }, [candidates, filters.state]);

  const summary = useMemo(() => {
    let relevantCandidates = Array.isArray(candidates) ? candidates : [];

    // Filtro por região - REMOVIDO para evitar problemas
    // Todos veem todos os candidatos

    const summaryData = SELECTION_STATUSES.reduce((acc, status) => {
      acc[status] = relevantCandidates.filter(c => c.status === status).length;
      return acc;
    }, {} as Record<SelectionStatus, number>);

    summaryData['Total'] = relevantCandidates.length;

    return summaryData;
  }, [candidates, rhProfile]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-cgb-primary" /> <span className="ml-2">Carregando talentos...</span></div>;
  }

  if (error) {
    return <div className="text-red-600 p-4 bg-red-50 rounded-md">Erro ao carregar talentos: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileText className="w-6 h-6 text-cgb-primary" />
            <span>Painel de Currículos</span>
          </CardTitle>
          <div className="space-y-1">
            <p className="text-gray-500">
              Gerencie todos os currículos cadastrados no sistema.
            </p>
            {rhProfile && !rhProfile.is_admin && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="text-blue-600 font-medium">
                  Visualizando apenas: {
                    rhProfile.assigned_states?.length > 0
                      ? `Estados: ${rhProfile.assigned_states.join(', ')}`
                      : rhProfile.assigned_cities?.length > 0
                        ? `Cidades: ${rhProfile.assigned_cities.join(', ')}`
                        : 'Todas as regiões'
                  }
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-700">Total</h3>
            <p className="text-3xl font-bold">{summary.Total || 0}</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-700">Análise de Currículo</h3>
            <p className="text-3xl font-bold text-yellow-800">{summary['Análise de Currículo'] || 0}</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-700">Em Entrevista</h3>
            <p className="text-3xl font-bold text-purple-800">{summary['Em Entrevista'] || 0}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-700">Aprovados</h3>
            <p className="text-3xl font-bold text-green-800">{summary.Aprovado || 0}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por nome, e-mail ou cargo..."
                className="pl-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
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
            <Select value={filters.status} onValueChange={value => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger><span>{filters.status === 'all' ? 'Todos os Status' : filters.status}</span></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {SELECTION_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidato</TableHead>
                  <TableHead>Cargo Desejado</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Currículo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map(candidate => {
                    const currentStatus = (candidate.status && SELECTION_STATUSES.includes(candidate.status as any))
                      ? candidate.status as SelectionStatus
                      : 'Cadastrado';
                    const statusColor = STATUS_COLORS[currentStatus] || "bg-gray-200 text-gray-800";
                    return (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <div className="font-medium">{candidate.name || 'Nome não informado'}</div>
                          <div className="text-sm text-gray-500">{candidate.email || 'E-mail não informado'}</div>
                        </TableCell>
                        <TableCell>{candidate.desiredJob || 'N/A'}</TableCell>
                        <TableCell>{`${candidate.city || ''}, ${candidate.state || ''}`}</TableCell>
                        <TableCell>
                          <Button asChild variant="outline" size="sm" disabled={!candidate.resume_file_url}>
                            <a href={candidate.resume_file_url || '#'} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 mr-2" /> Ver
                            </a>
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={currentStatus}
                            onValueChange={(value) => handleStatusChange(candidate.id, value as SelectionStatus)}
                            disabled={updateStatus.isPending}
                          >
                            <SelectTrigger className={`${statusColor} border-none font-semibold rounded-md text-xs h-auto py-1 px-2`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SELECTION_STATUSES.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Nenhum talento encontrado com os filtros selecionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeManagement;
