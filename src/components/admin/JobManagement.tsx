import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Edit, Plus, Eye, Trash2, Users, Loader2, Archive, ChevronsUpDown, MessageSquare, Briefcase, CheckCircle, Clock, Search, AlertTriangle, ChevronLeft, ChevronRight, XCircle
} from "lucide-react";
import { useAllJobs, useCreateJob, useUpdateJob, useDeleteJob, Job } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { useRHProfile, RHUser } from "@/hooks/useRH";
import { useToast } from "@/hooks/use-toast";
import { useJobRequests, JobRequest, CreateJobRequestData } from "@/hooks/useJobRequests";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SimpleModal } from "@/components/ui/simple-modal";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { departments } from "@/data/departments";
import { WORKLOAD_OPTIONS } from "@/data/workload-options";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobQuantityBadge from "./JobQuantityBadge";
import JobFlowStatusBadge from "./JobFlowStatusBadge";

// Mapeamento de status para aparência do Badge (chaves em inglês, texto em português)
const approvalStatusConfig = {
  draft: { text: "Rascunho", variant: "secondary" as const },
  pending_approval: { text: "Pendente", variant: "warning" as const },
  active: { text: "Ativa", variant: "success" as const },
  rejected: { text: "Rejeitada", variant: "destructive" as const },
  closed: { text: "Fechada", variant: "outline" as const },
  ativo: { text: "Ativa", variant: "success" as const },
  concluido: { text: "Concluída", variant: "default" as const },
};

const JobManagement = () => {
  // Hooks de autenticação e perfil
  const { user } = useAuth();
  const { data: rhProfile } = useRHProfile(user?.id);
  const { data: allJobs = [], isLoading } = useAllJobs();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const { toast } = useToast();

  // Estados para busca e filtro
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Paginação
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 50;
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hook para job requests (apenas para RH Admin/Admin)
  const {
    jobRequests,
    createJobFromRequest,
    approveAndCreateJob,
    updateJobRequest,
    updateJobRequestStatus,
    deleteJobRequest,
    isLoading: isLoadingRequests
  } = useJobRequests();

  // BUG FIX: Filtrar vagas por região para RECRUTADOR
  const jobs = React.useMemo(() => {
    if (!rhProfile || rhProfile.role !== 'recruiter') {
      return allJobs;
    }

    const assignedStates = rhProfile.assigned_states || [];
    const assignedCities = rhProfile.assigned_cities || [];

    if (assignedStates.length === 0 && assignedCities.length === 0) {
      return allJobs;
    }

    return allJobs.filter(job => {
      const matchState = assignedStates.length === 0 || assignedStates.includes(job.state || '');
      const matchCity = assignedCities.length === 0 || assignedCities.includes(job.city || '');
      return matchState && matchCity;
    });
  }, [allJobs, rhProfile]);

  // Deduplicar "Banco de Talentos": manter apenas 1 (preferir ativo; senão, o mais recente)
  const jobsDeduped = React.useMemo(() => {
    const normalizedTitle = (t: string | undefined) => (t || '').trim().toLowerCase();
    const talentJobs = jobs
      .filter(j => normalizedTitle(j.title) === 'banco de talentos')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const chosenTalent = talentJobs.find(j => j.approval_status === 'active' || j.status === 'active') || talentJobs[0];

    const others = jobs.filter(j => normalizedTitle(j.title) !== 'banco de talentos');
    return chosenTalent ? [chosenTalent, ...others] : others;
  }, [jobs]);

  // Filtrar vagas por busca e status
  const filteredJobs = React.useMemo(() => {
    return jobsDeduped.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'expired' && job.expires_at && new Date(job.expires_at) < new Date()) ||
        (statusFilter === 'expiring_soon' && job.expires_at && (() => {
          const daysUntilExpiry = Math.ceil((new Date(job.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
        })()) ||
        (statusFilter === 'active' && job.flow_status === 'ativa') ||
        (statusFilter === 'completed' && job.flow_status === 'concluida') ||
        (statusFilter === 'congelada' && job.flow_status === 'congelada');

      return matchesSearch && matchesStatus;
    });
  }, [jobsDeduped, searchTerm, statusFilter]);

  // Paginação baseada na lista filtrada
  const totalCount = filteredJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(totalCount, startIndex + pageSize);
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  // Calcular estatísticas
  const stats = React.useMemo(() => {
    return {
      total: jobsDeduped.length,
      expired: jobsDeduped.filter(job => job.expires_at && new Date(job.expires_at) < new Date()).length,
      expiring_soon: jobsDeduped.filter(job => {
        if (!job.expires_at) return false;
        const daysUntilExpiry = Math.ceil((new Date(job.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
      }).length,
      active: jobsDeduped.filter(job => job.flow_status === 'ativa').length,
      completed: jobsDeduped.filter(job => job.flow_status === 'concluida').length,
      congelada: jobsDeduped.filter(job => job.flow_status === 'congelada').length
    };
  }, [jobsDeduped]);

  const [formData, setFormData] = useState<Job | null>(null);
  const [requirementsText, setRequirementsText] = useState('');
  const [benefitsText, setBenefitsText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingTalentBank, setIsCreatingTalentBank] = useState(false);

  // Estados para edição de job requests
  const [editingRequest, setEditingRequest] = useState<JobRequest | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmRequest, setDeleteConfirmRequest] = useState<JobRequest | null>(null);

  // Filtrar job requests aprovadas que ainda não foram convertidas em vagas
  const approvedRequests = (jobRequests?.filter((request) => {
    if (request.status !== 'aprovado' || request.job_created) return false;
    return true; // Todos veem todas
  })) || [];

  // Filtrar job requests reprovadas (para histórico)
  const rejectedRequests = (jobRequests?.filter((request) => {
    if (request.status !== 'rejeitado') return false;
    return true; // Todos veem todas as reprovadas
  })) || [];

  // BUG FIX: Admin deve ver TODAS as solicitações (pendentes + aprovadas), mas NÃO reprovadas na seção principal
  const allRequestsForAdmin = rhProfile?.role === 'admin'
    ? (jobRequests?.filter((request) => {
      if (request.job_created) return false; // Excluir apenas as já convertidas em vagas
      if (request.status === 'rejeitado') return false; // Reprovadas vão para aba separada
      return true; // Admin vê pendentes + aprovadas na seção principal
    })) || []
    : approvedRequests;

  // DEBUG: Verificar todas as solicitações para admin
  React.useEffect(() => {
    if (rhProfile?.role === 'admin' && jobRequests) {
      console.log('🔍 [JobManagement] DEBUG Admin - Todas as solicitações:', jobRequests.length);
      console.log('🔍 [JobManagement] DEBUG Admin - Solicitações por status:', {
        pendente: jobRequests.filter(r => r.status === 'pendente').length,
        aprovado: jobRequests.filter(r => r.status === 'aprovado').length,
        rejeitado: jobRequests.filter(r => r.status === 'rejeitado').length
      });
      console.log('🔍 [JobManagement] DEBUG Admin - TESTETI:', jobRequests.find(r => r.title === 'TESTETI'));
      console.log('🔍 [JobManagement] DEBUG Admin - ApprovedRequests:', approvedRequests.length);
      console.log('🔍 [JobManagement] DEBUG Admin - AllRequestsForAdmin:', allRequestsForAdmin.length);
    }
  }, [jobRequests, rhProfile, approvedRequests]);

  const talentBankJobExists = jobsDeduped.some(job => job.title === "Banco de Talentos");

  // Debug da autenticação
  React.useEffect(() => {
    console.log('🔐 [JobManagement] Status de autenticação:', {
      user: user ? { id: user.id, email: user.email } : null,
      rhProfile: rhProfile ? 'carregado' : 'não carregado',
      isLoading: isLoading,
      jobsCount: jobs.length
    });
  }, [user, rhProfile, isLoading, jobs]);

  const handleCreateTalentBankJob = async () => {
    setIsCreatingTalentBank(true);
    try {
      const talentBankJobData = {
        title: "Banco de Talentos",
        department: "Recursos Humanos",
        city: "Remoto",
        state: "Todos",
        type: 'CLT' as const,
        description: "Esta é uma vaga para nosso banco de talentos. Seus dados ficarão armazenados para futuras oportunidades em diversas áreas e localidades. Candidate-se para fazer parte!",
        requirements: [],
        benefits: [],
        workload: "N/A",
        status: 'active' as const,
      };

      await createJob.mutateAsync(talentBankJobData);

      toast({
        title: "Banco de Talentos Criado!",
        description: "A vaga para o banco de talentos foi criada com sucesso e já está ativa.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar vaga",
        description: error?.message || JSON.stringify(error) || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTalentBank(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleFormSelectChange = (name: string, value: any) => {
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleEdit = (job: Job) => {
    setFormData(job);
    setRequirementsText(job.requirements?.join('\n') || '');
    setBenefitsText(job.benefits?.join('\n') || '');
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    let defaultState = "";
    let defaultCity = "";
    if (rhProfile && !rhProfile.is_admin) {
      if (rhProfile.assigned_states?.length) {
        defaultState = rhProfile.assigned_states[0];
        // Não podemos mais pre-selecionar a cidade, pois a lista é carregada dinamicamente
        // if (citiesByState[defaultState as keyof typeof citiesByState]) {
        //   defaultCity = citiesByState[defaultState as keyof typeof citiesByState][0];
        // }
      } else if (rhProfile.assigned_cities?.length) {
        defaultCity = rhProfile.assigned_cities[0];
        // A lógica inversa para encontrar o estado se torna complexa e desnecessária agora
      }
    }
    setFormData({
      id: undefined, title: "", department: "", city: defaultCity, state: defaultState, type: "CLT",
      description: "", requirements: [], benefits: [], workload: "40h semanais",
      status: "draft",
      approval_status: "draft", // Alterado para o valor em inglês
      flow_status: "ativa", // Status de visibilidade padrão
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setRequirementsText('');
    setBenefitsText('');
    setIsModalOpen(true);
  };

  const handleSave = async (submissionStatus: 'rascunho' | 'aprovacao_pendente' | 'publicar_direto') => {
    if (!formData) return;
    try {
      if (!user) throw new Error("Você precisa estar logado para salvar.");

      const statusMap = {
        rascunho: 'draft',
        aprovacao_pendente: 'pending_approval',
        publicar_direto: 'active' // ADMIN pode publicar diretamente
      };
      const statusToSend = statusMap[submissionStatus];

      const jobToSave = {
        ...formData,
        requirements: requirementsText.split('\n').filter(r => r.trim() !== ''),
        benefits: benefitsText.split('\n').filter(b => b.trim() !== ''),
        approval_status: statusToSend, // Define o status em inglês para o DB
        status: submissionStatus === 'publicar_direto' ? 'active' : 'draft', // Ativo se publicação direta
      };

      let jobDataClean: any = { ...jobToSave };
      delete jobDataClean.applicants;
      delete jobDataClean.posted;
      delete jobDataClean.created_at;
      delete jobDataClean.updated_at;
      delete jobDataClean.hired_count;

      // Garantir que flow_status tenha um valor válido
      if (!jobDataClean.flow_status) {
        jobDataClean.flow_status = 'ativa';
      }

      if (!jobToSave.id) {
        delete jobDataClean.id;
        jobDataClean.created_by = user.id;
        await createJob.mutateAsync(jobDataClean);
        toast({ title: "Vaga criada com sucesso!", description: "A nova vaga foi adicionada ao sistema." });
      } else {
        await updateJob.mutateAsync(jobDataClean);
        toast({ title: "Vaga atualizada com sucesso!", description: "As alterações foram salvas." });
      }
      setIsModalOpen(false);
      setFormData(null);
    } catch (error: any) {
      console.error('❌ [JobManagement] Erro ao salvar:', error);
      toast({ title: "Erro ao salvar vaga", description: error?.message || "Tente novamente mais tarde.", variant: "destructive" });
    }
  };

  const handleDelete = async (jobId: string) => {
    const jobToDelete = allJobs.find(j => j.id === jobId);
    if (jobToDelete && jobToDelete.title === "Banco de Talentos") {
      toast({
        title: "Ação Bloqueada",
        description: "A vaga 'Banco de Talentos' é protegida e não pode ser excluída.",
        variant: "destructive",
      });
      return;
    }
    try {
      await deleteJob.mutateAsync(jobId);
      toast({ title: "Vaga excluída com sucesso!", description: "A vaga foi removida do sistema." });
    } catch (error) {
      toast({ title: "Erro ao excluir vaga", description: "Tente novamente mais tarde.", variant: "destructive" });
    }
  };

  // Função para criar vaga a partir de job request aprovada
  const handleCreateJobFromRequest = async (requestId: string) => {
    try {
      await createJobFromRequest.mutateAsync(requestId);
      toast({
        title: "Vaga criada com sucesso!",
        description: "A vaga foi criada e está ativa para candidaturas."
      });
    } catch (error) {
      toast({
        title: "Erro ao criar vaga",
        description: "Não foi possível criar a vaga. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para aprovar e criar vaga diretamente
  const handleApproveAndCreateJob = async (requestId: string) => {
    try {
      await approveAndCreateJob.mutateAsync({
        requestId,
        notes: "Aprovado e criado pelo RH Admin"
      });
      toast({
        title: "Vaga aprovada e criada!",
        description: "A solicitação foi aprovada e a vaga foi criada diretamente."
      });
    } catch (error) {
      toast({
        title: "Erro ao aprovar e criar vaga",
        description: "Não foi possível aprovar e criar a vaga. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para editar job request
  const handleEditRequest = (request: JobRequest) => {
    setEditingRequest(request);
    setIsEditModalOpen(true);
  };

  // Função para salvar edição de job request
  const handleSaveEditRequest = async (data: Partial<CreateJobRequestData>) => {
    if (!editingRequest) return;

    try {
      await updateJobRequest.mutateAsync({
        id: editingRequest.id,
        data
      });
      setIsEditModalOpen(false);
      setEditingRequest(null);
    } catch (error) {
      // Error já tratado no hook
    }
  };

  // Função para confirmar exclusão de job request
  const handleDeleteRequest = async (request: JobRequest) => {
    setDeleteConfirmRequest(request);
  };

  // Função para executar exclusão
  const confirmDeleteRequest = async () => {
    if (!deleteConfirmRequest) return;

    try {
      await deleteJobRequest.mutateAsync(deleteConfirmRequest.id);
      setDeleteConfirmRequest(null);
    } catch (error) {
      // Error já tratado no hook
    }
  };

  return (
    <Card className="p-4 shadow-lg bg-white rounded-lg">
      <CardContent className="p-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Gerenciamento de Vagas</h2>
          <div className="flex gap-2">
            {!talentBankJobExists && (
              <Button variant="outline" onClick={handleCreateTalentBankJob} disabled={isCreatingTalentBank}>
                {isCreatingTalentBank ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2" />}
                Criar Banco de Talentos
              </Button>
            )}
            <Button onClick={handleCreate}><Plus className="mr-2" /> Nova Vaga</Button>
          </div>
        </div>

        <Dialog open={isModalOpen} onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false);
            setFormData(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{formData?.id ? "Editar Vaga" : "Criar Nova Vaga"}</DialogTitle>
            </DialogHeader>
            {formData && (
              <JobForm
                job={formData}
                requirementsText={requirementsText}
                benefitsText={benefitsText}
                onFormChange={handleFormChange}
                onSelectChange={handleFormSelectChange}
                onRequirementsChange={setRequirementsText}
                onBenefitsChange={setBenefitsText}
                onSave={handleSave}
                onCancel={() => {
                  setIsModalOpen(false);
                  setFormData(null);
                }}
                departments={departments}
                rhProfile={rhProfile}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
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

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Concluídas</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Congeladas</p>
                  <p className="text-2xl font-bold text-orange-700">{stats.congelada}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
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
                    <SelectItem value="completed">Concluídas</SelectItem>
                    <SelectItem value="congelada">Congeladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção de Job Requests - Tabs para Aprovadas e Reprovadas */}
        {((rhProfile?.role === 'admin' ? allRequestsForAdmin : approvedRequests).length > 0 || rejectedRequests.length > 0) && (
          <div className="mb-6">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-green-800">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Solicitações de Vagas</h2>
                      <p className="text-sm text-green-600 font-normal mt-1">
                        Gerencie solicitações aprovadas e reprovadas pelos gerentes
                      </p>
                    </div>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs defaultValue="approved" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="approved" className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Aprovadas
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                        {(rhProfile?.role === 'admin' ? allRequestsForAdmin : approvedRequests).length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Reprovadas
                      <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800">
                        {rejectedRequests.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  {/* Aba de Aprovadas */}
                  <TabsContent value="approved" className="mt-0">
                    <div className="grid gap-4">
                      {(rhProfile?.role === 'admin' ? allRequestsForAdmin : approvedRequests)
                        .filter(request => request.status === 'aprovado' && !request.job_created)
                        .map((request) => (
                    <Card key={request.id} className="bg-white border border-green-200 shadow-md hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                              {request.status === 'aprovado' ? (
                                <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                                  ✓ Aprovado
                                </Badge>
                              ) : request.status === 'pendente' ? (
                                <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
                                  ⏳ Pendente
                                </Badge>
                              ) : request.status === 'rejeitado' ? (
                                <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
                                  ✗ Rejeitado
                                </Badge>
                              ) : null}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <div className="p-0.5 bg-gray-100 rounded">
                                  <Briefcase className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-500">Departamento</p>
                                  <p className="text-sm font-medium">{request.department}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <div className="p-0.5 bg-gray-100 rounded">
                                  <Users className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-500">Localização</p>
                                  <p className="text-sm font-medium">{request.city}, {request.state}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <div className="p-0.5 bg-gray-100 rounded">
                                  <Clock className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-500">Carga Horária</p>
                                  <p className="text-sm font-medium">{request.workload}</p>
                                </div>
                              </div>
                              {request.status === 'aprovado' && request.approved_by && (
                                <div className="flex items-center gap-1.5 text-gray-600">
                                  <div className="p-0.5 bg-green-100 rounded">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-gray-500">Aprovado por</p>
                                    <p className="text-sm font-medium text-green-700">{request.approved_by}</p>
                                  </div>
                                </div>
                              )}
                              {request.status === 'rejeitado' && request.approved_by && (
                                <div className="flex items-center gap-1.5 text-gray-600">
                                  <div className="p-0.5 bg-red-100 rounded">
                                    <XCircle className="w-3.5 h-3.5 text-red-600" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-gray-500">Rejeitado por</p>
                                    <p className="text-sm font-medium text-red-700">{request.approved_by}</p>
                                  </div>
                                </div>
                              )}
                              {request.status === 'pendente' && (
                                <div className="flex items-center gap-1.5 text-gray-600">
                                  <div className="p-0.5 bg-yellow-100 rounded">
                                    <Clock className="w-3.5 h-3.5 text-yellow-600" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-gray-500">Status</p>
                                    <p className="text-sm font-medium text-yellow-700">Aguardando aprovação</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {request.description && (
                              <div className="mb-2 p-2 bg-gray-50 rounded text-xs">
                                <p className="text-xs font-medium text-gray-700 mb-0.5">Descrição:</p>
                                <p className="text-xs text-gray-600 leading-snug line-clamp-2">{request.description}</p>
                              </div>
                            )}

                            {request.notes && (
                              <div className="mb-2 p-2 bg-blue-50 rounded border-l-2 border-blue-200 text-xs">
                                <p className="text-xs font-medium text-blue-800 mb-0.5">Observações do Gerente:</p>
                                <p className="text-xs text-blue-700 leading-snug line-clamp-2">{request.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 justify-end pt-2 border-t border-gray-100">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRequest(request)}
                            className="flex items-center gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 h-7 text-xs px-2"
                          >
                            <Edit className="w-3 h-3" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRequest(request)}
                            className="flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50 h-7 text-xs px-2"
                          >
                            <Trash2 className="w-3 h-3" />
                            Cancelar
                          </Button>
                          {request.status === 'aprovado' && !request.job_created && (
                            <Button
                              size="sm"
                              onClick={() => handleCreateJobFromRequest(request.id)}
                              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white h-7 text-xs px-2"
                              disabled={createJobFromRequest.isPending}
                            >
                              {createJobFromRequest.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Plus className="w-3 h-3" />
                              )}
                              Publicar Vaga
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                      ))}
                    </div>
                    {((rhProfile?.role === 'admin' ? allRequestsForAdmin : approvedRequests).filter(r => r.status === 'aprovado' && !r.job_created).length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Nenhuma solicitação aprovada no momento</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Aba de Reprovadas - Apenas visualização (histórico) */}
                  <TabsContent value="rejected" className="mt-0">
                    <div className="grid gap-4">
                      {rejectedRequests.map((request) => (
                        <Card key={request.id} className="bg-white border border-red-200 shadow-md hover:shadow-lg transition-shadow duration-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                                  <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
                                    ✗ Rejeitado
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                    <div className="p-0.5 bg-gray-100 rounded">
                                      <Briefcase className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-gray-500">Departamento</p>
                                      <p className="text-sm font-medium">{request.department}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                    <div className="p-0.5 bg-gray-100 rounded">
                                      <Users className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-gray-500">Localização</p>
                                      <p className="text-sm font-medium">{request.city}, {request.state}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                    <div className="p-0.5 bg-gray-100 rounded">
                                      <Clock className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-gray-500">Carga Horária</p>
                                      <p className="text-sm font-medium">{request.workload}</p>
                                    </div>
                                  </div>
                                  {request.approved_by && (
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                      <div className="p-0.5 bg-red-100 rounded">
                                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-gray-500">Rejeitado por</p>
                                        <p className="text-sm font-medium text-red-700">{request.approved_by}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {request.description && (
                                  <div className="mb-2 p-2 bg-gray-50 rounded text-xs">
                                    <p className="text-xs font-medium text-gray-700 mb-0.5">Descrição:</p>
                                    <p className="text-xs text-gray-600 leading-snug line-clamp-2">{request.description}</p>
                                  </div>
                                )}

                                {request.notes && (
                                  <div className="mb-2 p-2 bg-blue-50 rounded border-l-2 border-blue-200 text-xs">
                                    <p className="text-xs font-medium text-blue-800 mb-0.5">Observações do Gerente:</p>
                                    <p className="text-xs text-blue-700 leading-snug">{request.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 justify-end pt-2 border-t border-gray-100">
                              {rhProfile?.role === 'admin' && (
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await updateJobRequestStatus.mutateAsync({
                                        id: request.id,
                                        status: 'aprovado',
                                        notes: 'Reaprovado pelo administrador'
                                      });
                                      toast({
                                        title: "Solicitação reaprovada!",
                                        description: "A solicitação foi reaprovada e aparecerá na aba de Aprovadas.",
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "Erro ao reaprovar",
                                        description: "Não foi possível reaprovar a solicitação.",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                  className="flex items-center gap-1.5 bg-yellow-600 hover:bg-yellow-700 text-white h-7 text-xs px-2"
                                  disabled={updateJobRequestStatus.isPending}
                                >
                                  {updateJobRequestStatus.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3" />
                                  )}
                                  Reaprovar
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {rejectedRequests.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <XCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Nenhuma solicitação reprovada no momento</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>
        ) : (
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vaga</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Candidatos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedJobs.map((job) => {
                  const statusKey = (job.approval_status || 'draft') as keyof typeof approvalStatusConfig;
                  const statusInfo = approvalStatusConfig[statusKey] || { text: job.approval_status || job.status || 'N/D', variant: 'secondary' as const };
                  return (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{job.title}</span>
                          <JobQuantityBadge
                            quantity={job.quantity || 1}
                            quantityFilled={job.quantity_filled || 0}
                            expiresAt={job.expires_at}
                            flowStatus={job.flow_status}
                          />
                        </div>
                      </TableCell>
                      <TableCell>{job.department}</TableCell>
                      <TableCell>{job.city}, {job.state}</TableCell>
                      <TableCell>{job.applicants || 0}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            {/* Só mostra o badge "Ativa" se flow_status não for 'concluida' ou 'congelada' */}
                            {job.flow_status !== 'concluida' && job.flow_status !== 'congelada' && (
                              <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
                            )}
                            {statusKey === 'rejected' && job.rejection_reason && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MessageSquare className="w-4 h-4 text-gray-500" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Motivo da Rejeição</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {job.rejection_reason}
                                    </p>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                          <JobFlowStatusBadge flowStatus={job.flow_status} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => { /* Implementar visualização */ }}><Eye className="w-4 h-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Ver Candidatos</p></TooltipContent>
                        </Tooltip>
                        {job.title !== 'Banco de Talentos' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(job)}><Edit className="w-4 h-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar Vaga</p></TooltipContent>
                          </Tooltip>
                        )}
                        {job.title !== 'Banco de Talentos' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setJobToDelete(job)}><Trash2 className="w-4 h-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Excluir Vaga</p></TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-2">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} a {endIndex} de {totalCount} vagas
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handlePageChange(0)} disabled={currentPage === 0}>Primeira</Button>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(Math.max(0, currentPage - 1))} disabled={currentPage === 0}>
                <ChevronLeft className="w-4 h-4" /> Anterior
              </Button>
              <span className="px-3 py-1 text-sm font-medium">Página {currentPage + 1} de {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage >= totalPages - 1}>
                Próxima <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages - 1)} disabled={currentPage >= totalPages - 1}>Última</Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Modal de Edição de Job Request */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Editar Solicitação de Vaga
            </DialogTitle>
          </DialogHeader>
          {editingRequest && (
            <JobRequestEditForm
              request={editingRequest}
              onSave={handleSaveEditRequest}
              onCancel={() => setIsEditModalOpen(false)}
              isLoading={updateJobRequest.isPending}
              rhProfile={rhProfile}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      {/* Confirmação para cancelar solicitação de vaga */}
      <SimpleModal
        open={!!deleteConfirmRequest}
        onClose={() => setDeleteConfirmRequest(null)}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Confirmar Cancelamento</h3>
              <p className="text-sm text-red-600">Esta ação não pode ser desfeita.</p>
            </div>
          </div>

          {deleteConfirmRequest && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="font-medium text-gray-900 mb-1">
                {deleteConfirmRequest.title}
              </p>
              <p className="text-sm text-gray-600">
                {deleteConfirmRequest.department} • {deleteConfirmRequest.city}, {deleteConfirmRequest.state}
              </p>
            </div>
          )}

          <p className="text-gray-700">
            Tem certeza de que deseja cancelar esta solicitação de vaga?
            Esta ação removerá permanentemente a solicitação do sistema.
          </p>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmRequest(null)}
            >
              Manter Solicitação
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteRequest}
              disabled={deleteJobRequest.isPending}
            >
              {deleteJobRequest.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancelar Solicitação
                </>
              )}
            </Button>
          </div>
        </div>
      </SimpleModal>

      {/* Confirmação para exclusão de vaga */}
      <SimpleModal
        open={!!jobToDelete}
        onClose={() => setJobToDelete(null)}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Excluir Vaga</h3>
              <p className="text-sm text-red-600">Esta ação não pode ser desfeita.</p>
            </div>
          </div>

          {jobToDelete && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="font-medium text-gray-900 mb-1">{jobToDelete.title}</p>
              <p className="text-sm text-gray-600">{jobToDelete.department} • {jobToDelete.city}, {jobToDelete.state}</p>
            </div>
          )}

          <p className="text-gray-700">
            Tem certeza de que deseja excluir esta vaga? Os candidatos associados continuarão no histórico, mas a vaga será removida da gestão.
          </p>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setJobToDelete(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!jobToDelete?.id) return;
                await handleDelete(jobToDelete.id);
                setJobToDelete(null);
              }}
              disabled={deleteJob.isPending}
            >
              {deleteJob.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Vaga
                </>
              )}
            </Button>
          </div>
        </div>
      </SimpleModal>
    </Card>
  );
};

interface JobFormProps {
  job: Job;
  requirementsText: string;
  benefitsText: string;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: any) => void;
  onRequirementsChange: (value: string) => void;
  onBenefitsChange: (value: string) => void;
  onSave: (submissionStatus: 'rascunho' | 'aprovacao_pendente' | 'publicar_direto') => Promise<void>;
  onCancel: () => void;
  departments: string[];
  rhProfile: RHUser | null | undefined;
}

interface State {
  id: number;
  sigla: string;
  nome: string;
}

interface City {
  id: number;
  nome: string;
}

const JobForm = ({
  job, requirementsText, benefitsText,
  onFormChange, onSelectChange, onRequirementsChange, onBenefitsChange,
  onSave, onCancel, departments, rhProfile
}: JobFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState<'rascunho' | 'aprovacao_pendente' | 'publicar_direto' | false>(false);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [openCityPopover, setOpenCityPopover] = useState(false);

  const isTalentBank = job.title === "Banco de Talentos";

  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoadingStates(true);
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        let data = await response.json();

        if (rhProfile && !rhProfile.is_admin && rhProfile.assigned_states && rhProfile.assigned_states.length > 0) {
          data = data.filter((state: State) => rhProfile.assigned_states.includes(state.sigla));
        }

        setStates(data);
      } catch (error) {
        console.error("Erro ao buscar estados:", error);
      } finally {
        setLoadingStates(false);
      }
    };
    if (!isTalentBank) {
      fetchStates();
    } else {
      setLoadingStates(false);
    }
  }, [isTalentBank, rhProfile]);

  useEffect(() => {
    if (!job.state || isTalentBank) {
      setCities([]);
      return;
    }
    const fetchCities = async () => {
      try {
        setLoadingCities(true);

        // Primeiro buscar o ID do estado pela sigla
        const stateResponse = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${job.state}`);
        const stateData = await stateResponse.json();

        if (stateData && stateData.id) {
          // Agora buscar as cidades usando o ID do estado
          const citiesResponse = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateData.id}/municipios?orderBy=nome`);
          const citiesData = await citiesResponse.json();
          setCities(citiesData);
        } else {
          console.error("Estado não encontrado:", job.state);
          setCities([]);
        }
      } catch (error) {
        console.error("Erro ao buscar cidades:", error);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [job.state, isTalentBank]);

  const handleStateChange = (value: string) => {
    onSelectChange("state", value);
    onSelectChange("city", ""); // Reseta a cidade quando o estado muda
  };

  const handleSubmit = async (submissionStatus: 'rascunho' | 'aprovacao_pendente' | 'publicar_direto') => {
    setIsSubmitting(submissionStatus);
    try {
      await onSave(submissionStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6 p-1">
      <fieldset disabled={!!isSubmitting}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Vaga</Label>
            <Input name="title" value={job.title} onChange={onFormChange} required maxLength={255} />
            <p className="text-xs text-gray-500">{(job.title?.length || 0)}/255</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Select name="department" value={job.department} onValueChange={(value) => onSelectChange("department", value)}>
              <SelectTrigger><SelectValue placeholder="Selecione o departamento" /></SelectTrigger>
              <SelectContent>{departments.map(dep => <SelectItem key={dep} value={dep}>{dep}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="state">Estado</Label>
            <Select name="state" value={job.state} onValueChange={handleStateChange} disabled={isTalentBank || loadingStates}>
              <SelectTrigger>
                <SelectValue placeholder={loadingStates ? "Carregando..." : "Selecione o estado"} />
              </SelectTrigger>
              <SelectContent>
                {loadingStates ? (
                  <div className="flex items-center justify-center p-2"><Loader2 className="w-4 h-4 animate-spin" /></div>
                ) : (
                  states.map(state => <SelectItem key={state.sigla} value={state.sigla}>{state.nome}</SelectItem>)
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Popover open={openCityPopover} onOpenChange={setOpenCityPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCityPopover}
                  className="w-full justify-between"
                  disabled={isTalentBank || !job.state || loadingCities}
                >
                  <span className="truncate">
                    {loadingCities
                      ? "Carregando cidades..."
                      : (job.city ? job.city : "Selecione a cidade")
                    }
                  </span>
                  {loadingCities ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Buscar cidade..." />
                  <CommandList>
                    {loadingCities ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span>Carregando cidades...</span>
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                        <CommandGroup>
                          {cities.map((city) => (
                            <CommandItem
                              key={city.id}
                              value={city.nome}
                              onSelect={(currentValue) => {
                                onSelectChange("city", currentValue === job.city ? "" : city.nome);
                                setOpenCityPopover(false);
                              }}
                            >
                              {city.nome}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select name="type" value={job.type} onValueChange={(value) => onSelectChange("type", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CLT">CLT</SelectItem>
                <SelectItem value="PJ">PJ</SelectItem>
                <SelectItem value="Temporário">Temporário</SelectItem>
                <SelectItem value="Estágio">Estágio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade de Vagas *</Label>
            <Input
              name="quantity"
              type="number"
              min="1"
              max="50"
              value={job.quantity || 1}
              onChange={onFormChange}
              placeholder="1"
            />
            <p className="text-xs text-blue-600">
              ℹ️ Quantas vagas iguais você precisa? (máx: 50)
            </p>
          </div>
          <div className="space-y-2">
            {/* Campo reservado para futuras funcionalidades */}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea name="description" value={job.description} onChange={onFormChange} rows={5} required />
        </div>

        {/* Campos de Controle Interno */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">📋 Controle Interno</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="solicitante_nome">Nome do Solicitante</Label>
              <Input
                name="solicitante_nome"
                value={job.solicitante_nome || ''}
                onChange={onFormChange}
                placeholder="Ex: João Silva"
              />
              <p className="text-xs text-gray-500">
                ℹ️ Para controle interno - quem está solicitando esta vaga
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="solicitante_funcao">Gerente Responsável</Label>
              <Input
                name="solicitante_funcao"
                value={job.solicitante_funcao || ''}
                onChange={onFormChange}
                maxLength={255}
                placeholder="Ex: Fernando Sousa - Gerente Tático - CT .150.35"
              />
              <p className="text-xs text-gray-500">{(job.solicitante_funcao?.length || 0)}/255</p>
              <p className="text-xs text-gray-500">
                ℹ️ Para controle interno - função e tipo de contrato
              </p>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <Label htmlFor="observacoes_internas">Observações Internas</Label>
            <Textarea
              name="observacoes_internas"
              value={job.observacoes_internas || ''}
              onChange={onFormChange}
              placeholder="Observações adicionais para controle interno..."
              rows={2}
            />
            <p className="text-xs text-gray-500">
              ℹ️ Estas informações são apenas para controle interno
            </p>
          </div>

          {/* Tipo de Solicitação */}
          <div className="space-y-2 mt-4">
            <Label htmlFor="tipo_solicitacao">Tipo de Solicitação *</Label>
            <Select
              value={job.tipo_solicitacao || 'aumento_quadro'}
              onValueChange={(value) => onSelectChange("tipo_solicitacao", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de solicitação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aumento_quadro">Aumento de Quadro</SelectItem>
                <SelectItem value="substituicao">Substituição</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              ℹ️ Selecione se é para aumentar o quadro ou substituir alguém
            </p>
          </div>

          {/* Campo condicional para substituição */}
          {job.tipo_solicitacao === "substituicao" && (
            <div className="space-y-2 mt-4">
              <Label htmlFor="nome_substituido">Nomes das Pessoas que Sairam *</Label>
              <Textarea
                name="nome_substituido"
                value={job.nome_substituido || ''}
                onChange={onFormChange}
                placeholder="Digite 1 nome por linha (até 20 nomes recomendados)"
                rows={6}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  ℹ️ Insira um nome por linha. Este campo aceita múltiplos nomes.
                </p>
                <p className={`text-xs ${((job.nome_substituido || '').split('\n').filter(n => n.trim()).length > 20) ? 'text-red-600' : 'text-gray-500'}`}>
                  {((job.nome_substituido || '').split('\n').filter(n => n.trim()).length)} nomes {((job.nome_substituido || '').split('\n').filter(n => n.trim()).length > 20) ? '(recomendado até 20)' : ''}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="requirements">Requisitos (um por linha)</Label>
            <Textarea name="requirements" value={requirementsText} onChange={(e) => onRequirementsChange(e.target.value)} rows={5} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="benefits">Benefícios (um por linha)</Label>
            <Textarea name="benefits" value={benefitsText} onChange={(e) => onBenefitsChange(e.target.value)} rows={5} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="workload">Carga Horária</Label>
            <Select name="workload" value={job.workload} onValueChange={(value) => onSelectChange("workload", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a carga horária" />
              </SelectTrigger>
              <SelectContent>
                {WORKLOAD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {job.id && (
            <div className="space-y-2">
              <Label htmlFor="flow_status">Status de Visibilidade *</Label>
              <Select
                name="flow_status"
                value={job.flow_status || 'ativa'}
                onValueChange={(value) => onSelectChange("flow_status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">✓ Ativa (visível no site)</SelectItem>
                  <SelectItem value="concluida">✓ Concluída (não visível)</SelectItem>
                  <SelectItem value="congelada">⏸ Congelada (não visível)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                ℹ️ Apenas vagas "Ativas" aparecem no site público
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={!!isSubmitting}>Cancelar</Button>
          <Button type="button" variant="secondary" onClick={() => handleSubmit('rascunho')} disabled={!!isSubmitting}>
            {isSubmitting === 'rascunho' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Salvar Rascunho
          </Button>
          <Button type="button" onClick={() => handleSubmit('aprovacao_pendente')} disabled={!!isSubmitting}>
            {isSubmitting === 'aprovacao_pendente' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Enviar para Aprovação
          </Button>
          {/* Botão de publicação direta apenas para ADMIN */}
          {rhProfile && typeof rhProfile === 'object' && 'is_admin' in rhProfile && rhProfile.is_admin && (
            <Button
              type="button"
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleSubmit('publicar_direto')}
              disabled={!!isSubmitting}
            >
              {isSubmitting === 'publicar_direto' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Publicar Direto
            </Button>
          )}
        </div>
      </fieldset>
    </form>
  )
};

// Componente para formulário de edição de job request
const JobRequestEditForm = ({
  request,
  onSave,
  onCancel,
  isLoading,
  rhProfile
}: {
  request: JobRequest;
  onSave: (data: Partial<CreateJobRequestData>) => void;
  onCancel: () => void;
  isLoading: boolean;
  rhProfile?: RHUser | null;
}) => {
  const [formData, setFormData] = useState({
    title: request.title || '',
    department: request.department || '',
    // Limpar distrito se a cidade tiver formato "Cidade - Distrito"
    city: request.city ? request.city.split(' - ')[0] : '',
    state: request.state || '',
    type: request.type || 'CLT',
    description: request.description || '',
    requirements: Array.isArray(request.requirements) ? request.requirements : [],
    benefits: Array.isArray(request.benefits) ? request.benefits : [],
    workload: request.workload || '40h/semana',
    justification: request.justification || '',
    // Campos adicionais para completar a vaga
    solicitante_nome: request.solicitante_nome || '',
    solicitante_funcao: request.solicitante_funcao || '',
    observacoes_internas: request.observacoes_internas || '',
    tipo_solicitacao: request.tipo_solicitacao || 'aumento_quadro',
    nome_substituido: request.nome_substituido || '',
    quantity: request.quantity || 1
  });

  // Estados para lista suspensa de estados e cidades
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [openCityPopover, setOpenCityPopover] = useState(false);

  // Buscar estados
  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoadingStates(true);
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        let data = await response.json();

        // Filtrar estados se o usuário tiver restrições
        if (rhProfile && !rhProfile.is_admin && rhProfile.assigned_states && rhProfile.assigned_states.length > 0) {
          data = data.filter((state: State) => rhProfile.assigned_states.includes(state.sigla));
        }

        setStates(data);
      } catch (error) {
        console.error("Erro ao buscar estados:", error);
      } finally {
        setLoadingStates(false);
      }
    };
    fetchStates();
  }, [rhProfile]);

  // Buscar cidades quando estado é selecionado
  useEffect(() => {
    if (!formData.state) {
      setCities([]);
      return;
    }

    const fetchCities = async () => {
      try {
        setLoadingCities(true);

        // Primeiro buscar o ID do estado pela sigla
        const stateResponse = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}`);
        const stateData = await stateResponse.json();

        if (stateData && stateData.id) {
          // Agora buscar as cidades usando o ID do estado
          const citiesResponse = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateData.id}/municipios?orderBy=nome`);
          const citiesData = await citiesResponse.json();
          setCities(citiesData);
        } else {
          console.error("Estado não encontrado:", formData.state);
          setCities([]);
        }
      } catch (error) {
        console.error("Erro ao buscar cidades:", error);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [formData.state]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Se mudou o estado, resetar cidade
    if (field === 'state') {
      setFormData(prev => ({ ...prev, [field]: value, city: '' }));
    }
  };

  const handleStateChange = (value: string) => {
    handleChange('state', value);
  };

  const handleCitySelect = (cityName: string) => {
    setFormData(prev => ({ ...prev, city: cityName }));
    setOpenCityPopover(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título da Vaga *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Departamento *</Label>
          <Select value={formData.department} onValueChange={(value) => handleChange('department', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="state">Estado *</Label>
          <Select 
            value={formData.state} 
            onValueChange={handleStateChange}
            disabled={loadingStates}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingStates ? "Carregando..." : "Selecione o estado"} />
            </SelectTrigger>
            <SelectContent>
              {loadingStates ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                states.map(state => (
                  <SelectItem key={state.sigla} value={state.sigla}>
                    {state.nome}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="workload">Carga Horária *</Label>
          <Select value={formData.workload} onValueChange={(value) => handleChange('workload', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="40h/semana">40h/semana</SelectItem>
              <SelectItem value="44h/semana">44h/semana</SelectItem>
              <SelectItem value="36h/semana">36h/semana</SelectItem>
              <SelectItem value="30h/semana">30h/semana</SelectItem>
              <SelectItem value="20h/semana">20h/semana</SelectItem>
              <SelectItem value="Meio período">Meio período</SelectItem>
              <SelectItem value="Período integral">Período integral</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade *</Label>
          <Popover open={openCityPopover} onOpenChange={setOpenCityPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCityPopover}
                className="w-full justify-between"
                disabled={!formData.state || loadingCities}
              >
                <span className="truncate">
                  {loadingCities
                    ? "Carregando cidades..."
                    : (formData.city ? formData.city : "Selecione a cidade")
                  }
                </span>
                {loadingCities ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Buscar cidade..." />
                <CommandList>
                  {loadingCities ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span>Carregando cidades...</span>
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                      <CommandGroup>
                        {cities.map((city) => (
                          <CommandItem
                            key={city.id}
                            value={city.nome}
                            onSelect={() => handleCitySelect(city.nome)}
                          >
                            {city.nome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição da Vaga *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="justification">Justificativa</Label>
        <Textarea
          id="justification"
          value={formData.justification}
          onChange={(e) => handleChange('justification', e.target.value)}
          rows={3}
          placeholder="Justifique a necessidade desta vaga..."
        />
      </div>

      {/* Campos adicionais para completar a vaga */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="requirements">Requisitos (um por linha)</Label>
          <Textarea
            id="requirements"
            value={Array.isArray(formData.requirements) ? formData.requirements.join('\n') : ''}
            onChange={(e) => handleChange('requirements', e.target.value.split('\n').filter(r => r.trim()))}
            rows={5}
            placeholder="Digite os requisitos da vaga..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="benefits">Benefícios (um por linha)</Label>
          <Textarea
            id="benefits"
            value={Array.isArray(formData.benefits) ? formData.benefits.join('\n') : ''}
            onChange={(e) => handleChange('benefits', e.target.value.split('\n').filter(b => b.trim()))}
            rows={5}
            placeholder="Digite os benefícios oferecidos..."
          />
        </div>
      </div>

      {/* Campos de Controle Interno */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">📋 Controle Interno</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="solicitante_nome">Nome do Solicitante</Label>
            <Input
              id="solicitante_nome"
              value={formData.solicitante_nome || ''}
              onChange={(e) => handleChange('solicitante_nome', e.target.value)}
              placeholder="Ex: João Silva"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="solicitante_funcao">Gerente Responsável</Label>
            <Input
              id="solicitante_funcao"
              value={formData.solicitante_funcao || ''}
              onChange={(e) => handleChange('solicitante_funcao', e.target.value)}
              placeholder="Ex: Fernando Sousa - Gerente Tático - CT .150.35"
            />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Label htmlFor="observacoes_internas">Observações Internas</Label>
          <Textarea
            id="observacoes_internas"
            value={formData.observacoes_internas || ''}
            onChange={(e) => handleChange('observacoes_internas', e.target.value)}
            placeholder="Observações adicionais para controle interno..."
            rows={2}
          />
        </div>

        {/* Tipo de Solicitação */}
        <div className="space-y-2 mt-4">
          <Label htmlFor="tipo_solicitacao">Tipo de Solicitação</Label>
          <Select
            value={formData.tipo_solicitacao || 'aumento_quadro'}
            onValueChange={(value) => handleChange('tipo_solicitacao', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de solicitação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aumento_quadro">Aumento de Quadro</SelectItem>
              <SelectItem value="substituicao">Substituição</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campo condicional para substituição */}
        {formData.tipo_solicitacao === "substituicao" && (
          <div className="space-y-2 mt-4">
            <Label htmlFor="nome_substituido">Nomes das Pessoas que Sairam</Label>
            <Textarea
              id="nome_substituido"
              value={formData.nome_substituido || ''}
              onChange={(e) => handleChange('nome_substituido', e.target.value)}
              placeholder="Digite 1 nome por linha (até 20 nomes recomendados)"
              rows={6}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">ℹ️ Um nome por linha. Campo aceita múltiplos nomes.</p>
              <p className={`text-xs ${((formData.nome_substituido || '').split('\n').filter(n => n.trim()).length > 20) ? 'text-red-600' : 'text-gray-500'}`}>
                {((formData.nome_substituido || '').split('\n').filter(n => n.trim()).length)} nomes {((formData.nome_substituido || '').split('\n').filter(n => n.trim()).length > 20) ? '(recomendado até 20)' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Quantidade de vagas */}
        <div className="space-y-2 mt-4">
          <Label htmlFor="quantity">Quantidade de Vagas</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max="50"
            value={formData.quantity || 1}
            onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
            placeholder="1"
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Edit className="w-4 h-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default JobManagement;
