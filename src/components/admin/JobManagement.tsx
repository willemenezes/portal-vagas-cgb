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
  Edit, Plus, Eye, Trash2, Users, Loader2, Archive, ChevronsUpDown, MessageSquare, Briefcase, CheckCircle, Clock, Search, AlertTriangle, ChevronLeft, ChevronRight, XCircle, FileText
} from "lucide-react";
import { useAllJobs, useCreateJob, useUpdateJob, useDeleteJob, Job } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { useRHProfile, RHUser } from "@/hooks/useRH";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SimpleModal } from "@/components/ui/simple-modal";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { departments } from "@/data/departments";
import { contracts } from "@/data/contracts";
import { WORKLOAD_OPTIONS } from "@/data/workload-options";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import JobQuantityBadge from "./JobQuantityBadge";
import JobFlowStatusBadge from "./JobFlowStatusBadge";
import { JobTitleSelect } from "./JobTitleSelect";
import { calculateBusinessDaysUntil } from "@/utils/business-days";

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
  const { data: allJobs = [], isLoading, error: jobsError } = useAllJobs();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const { toast } = useToast();

  // Log de erro para debug
  useEffect(() => {
    if (jobsError) {
      console.error('❌ [JobManagement] Erro ao carregar vagas:', jobsError);
      toast({
        title: "Erro ao carregar vagas",
        description: jobsError instanceof Error ? jobsError.message : "Erro desconhecido. Tente recarregar a página.",
        variant: "destructive",
      });
    }
  }, [jobsError, toast]);

  // Estados para busca e filtro
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Paginação
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 50;
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // Filtrar apenas vagas processadas (aprovadas) - mesmo critério do relatório
  // IMPORTANTE: Incluir vagas concluídas e congeladas mesmo que não tenham approval_status === 'active'
  const processedJobs = React.useMemo(() => {
    if (!allJobs || allJobs.length === 0) return [];

    console.log('🔄 [JobManagement] Processando', allJobs.length, 'vagas...');
    const startTime = performance.now();

    const filtered = allJobs.filter(j => {
      // Incluir todas as vagas que foram processadas (aprovadas)
      // Isso inclui: ativas, concluídas, congeladas, etc.
      // Excluir apenas: rascunhos, pendentes de aprovação, rejeitadas
      const approval = String(j.approval_status || '').toLowerCase();
      const status = String(j.status || '').toLowerCase();
      const flowStatus = String(j.flow_status || '').toLowerCase();

      // Se tem flow_status de concluída ou congelada, SEMPRE incluir (mesmo sem approval_status)
      if (flowStatus === 'concluida' || flowStatus === 'congelada') {
        // Apenas verificar se não é rejeitada
        return !['rejected', 'rejeitado'].includes(approval);
      }

      // Para outras vagas, verificar se foi aprovada OU tem flow_status ativa
      const isApproved = ['active', 'ativo'].includes(approval);
      const hasFlowStatus = flowStatus === 'ativa';
      const isNotDraft = !['draft', 'rascunho'].includes(status) && !['draft', 'rascunho'].includes(approval);
      const isNotPending = !['pending_approval', 'aprovacao_pendente'].includes(approval);
      const isNotRejected = !['rejected', 'rejeitado'].includes(approval);

      return (isApproved || hasFlowStatus) && isNotDraft && isNotPending && isNotRejected;
    });

    const endTime = performance.now();
    console.log(`✅ [JobManagement] ${filtered.length} vagas processadas em ${Math.round(endTime - startTime)}ms`);

    return filtered;
  }, [allJobs]);

  // Função helper para normalizar strings (case-insensitive e sem acentos)
  const normalizeString = (str: string | null | undefined): string => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  // BUG FIX: Filtrar vagas por região para RECRUTADOR
  const jobs = React.useMemo(() => {
    if (!rhProfile || rhProfile.role !== 'recruiter') {
      return processedJobs;
    }

    const assignedStates = rhProfile.assigned_states || [];
    const assignedCities = rhProfile.assigned_cities || [];

    if (assignedStates.length === 0 && assignedCities.length === 0) {
      return processedJobs;
    }

    // Normalizar estados e cidades atribuídos
    const normalizedStates = assignedStates.map(s => normalizeString(s));
    const normalizedCities = assignedCities.map(c => normalizeString(c));

    return processedJobs.filter(job => {
      const jobState = normalizeString(job.state);
      const jobCity = normalizeString(job.city);

      const matchState = normalizedStates.length === 0 || normalizedStates.includes(jobState);
      const matchCity = normalizedCities.length === 0 || normalizedCities.includes(jobCity);

      return matchState && matchCity;
    });
  }, [processedJobs, rhProfile]);

  // Função helper para calcular dias até expiração (reutilizada para consistência)
  // IMPORTANTE: Definir ANTES de usar em filteredJobs e stats
  const getDaysUntilExpiry = React.useCallback((expiryDate: string) => {
    const days = calculateBusinessDaysUntil(expiryDate);
    return days ?? 0;
  }, []);

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

  // Extrair listas únicas de cidades e departamentos das vagas disponíveis
  const uniqueCities = React.useMemo(() => {
    const cities = new Set<string>();
    jobsDeduped.forEach(job => {
      if (job.city && job.city.trim()) {
        cities.add(job.city.trim());
      }
    });
    return Array.from(cities).sort();
  }, [jobsDeduped]);

  const uniqueDepartments = React.useMemo(() => {
    const depts = new Set<string>();
    jobsDeduped.forEach(job => {
      if (job.department && job.department.trim()) {
        depts.add(job.department.trim());
      }
    });
    return Array.from(depts).sort();
  }, [jobsDeduped]);

  // Filtrar vagas por busca, status, cidade e departamento
  const filteredJobs = React.useMemo(() => {
    return jobsDeduped.filter(job => {
      // Filtro de busca (título, departamento ou cidade)
      const matchesSearch = searchTerm.trim() === '' ||
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.city.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por cidade
      const matchesCity = cityFilter === 'all' ||
        (job.city && job.city.trim().toLowerCase() === cityFilter.toLowerCase());

      // Filtro por departamento
      const matchesDepartment = departmentFilter === 'all' ||
        (job.department && job.department.trim().toLowerCase() === departmentFilter.toLowerCase());

      // Helper para verificar se vaga está ativa (não concluída nem congelada)
      // Normalizar flow_status para comparação consistente
      const normalizedFlowStatus = String(job.flow_status || '').toLowerCase().trim();
      const isActive = normalizedFlowStatus !== 'concluida' && normalizedFlowStatus !== 'congelada';

      // Filtro por status
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'expired' && isActive && job.expires_at && (() => {
          const days = getDaysUntilExpiry(job.expires_at);
          return days < 0; // Apenas se já passou (não inclui "expira hoje")
        })()) ||
        (statusFilter === 'active' && normalizedFlowStatus === 'ativa') ||
        (statusFilter === 'completed' && normalizedFlowStatus === 'concluida') ||
        (statusFilter === 'congelada' && normalizedFlowStatus === 'congelada');

      return matchesSearch && matchesCity && matchesDepartment && matchesStatus;
    });
  }, [jobsDeduped, searchTerm, statusFilter, cityFilter, departmentFilter, getDaysUntilExpiry]);

  // Paginação baseada na lista filtrada
  const totalCount = filteredJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(totalCount, startIndex + pageSize);
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  // Calcular estatísticas
  // IMPORTANTE: Vagas concluídas ou congeladas NÃO devem contar como expiradas
  // IMPORTANTE: "Expira hoje" (days === 0) NÃO deve contar como expirada
  // IMPORTANTE: Considerar o campo 'quantity' de cada vaga (ex: 3 vagas em Castanhal = quantity: 3)
  const getQuantity = (job: Job) => job.quantity || 1; // Se não tiver quantity, assume 1

  const stats = React.useMemo(() => {
    // DEBUG: Log para verificar vagas concluídas
    const completedJobs = jobsDeduped.filter(job => {
      const flowStatus = String(job.flow_status || '').toLowerCase().trim();
      return flowStatus === 'concluida';
    });

    console.log('📊 [JobManagement] Calculando estatísticas:', {
      totalJobs: jobsDeduped.length,
      completedJobsCount: completedJobs.length,
      completedJobsDetails: completedJobs.map(j => ({
        id: j.id,
        title: j.title,
        flow_status: j.flow_status,
        quantity: j.quantity,
        approval_status: j.approval_status
      }))
    });

    const completedSum = jobsDeduped.reduce((sum, job) => {
      const flowStatus = String(job.flow_status || '').toLowerCase().trim();
      if (flowStatus === 'concluida') {
        const qty = getQuantity(job);
        console.log(`✅ [JobManagement] Contando vaga concluída: ${job.title} (quantity: ${qty}, flow_status: ${job.flow_status})`);
        return sum + qty;
      }
      return sum;
    }, 0);

    console.log('📊 [JobManagement] Total de vagas concluídas calculado:', completedSum);

    return {
      total: jobsDeduped.reduce((sum, job) => sum + getQuantity(job), 0),
      expired: jobsDeduped.reduce((sum, job) => {
        // Só contar como expirada se:
        // 1. Tem data de expiração
        // 2. A data já passou (days < 0, não days <= 0)
        // 3. A vaga está ATIVA (não concluída nem congelada)
        const isActive = job.flow_status !== 'concluida' && job.flow_status !== 'congelada';
        if (!isActive || !job.expires_at) return sum;
        const days = getDaysUntilExpiry(job.expires_at);
        if (days < 0) { // Apenas se já passou (não inclui "expira hoje")
          return sum + getQuantity(job);
        }
        return sum;
      }, 0),
      active: jobsDeduped.reduce((sum, job) => {
        if (job.flow_status === 'ativa') {
          return sum + getQuantity(job);
        }
        return sum;
      }, 0),
      completed: completedSum,
      congelada: jobsDeduped.reduce((sum, job) => {
        if (job.flow_status === 'congelada') {
          return sum + getQuantity(job);
        }
        return sum;
      }, 0)
    };
  }, [jobsDeduped, getDaysUntilExpiry]);

  const [formData, setFormData] = useState<Job | null>(null);
  const [requirementsText, setRequirementsText] = useState('');
  const [benefitsText, setBenefitsText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingTalentBank, setIsCreatingTalentBank] = useState(false);


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

      // FLUXO CORRIGIDO: Quando uma vaga é editada, ela DEVE voltar para aprovação
      // Exceto se for admin escolhendo "publicar_direto"
      if (jobToSave.id) {
        // Buscar a vaga atual para verificar o status anterior
        const currentJob = allJobs.find(j => j.id === jobToSave.id);
        const currentApprovalStatus = String(currentJob?.approval_status || '').toLowerCase();
        const currentStatus = String(currentJob?.status || '').toLowerCase();
        const isCurrentlyActive = ['active', 'ativo'].includes(currentApprovalStatus) || ['active', 'ativo'].includes(currentStatus);

        console.log('🔍 [JobManagement] ===== VERIFICANDO VAGA PARA EDIÇÃO =====');
        console.log('🔍 [JobManagement] Dados da vaga atual:', {
          jobId: jobToSave.id,
          title: currentJob?.title,
          currentFlowStatus: currentJob?.flow_status,
          currentApprovalStatus: currentJob?.approval_status,
          currentStatus: currentJob?.status,
          isCurrentlyActive
        });
        console.log('🔍 [JobManagement] Dados do salvamento:', {
          submissionStatus,
          statusToSend,
          newApprovalStatus: jobDataClean.approval_status
        });

        // REGRA PRINCIPAL: Se o usuário escolheu "Enviar para Aprovação", SEMPRE forçar pending_approval
        if (submissionStatus === 'aprovacao_pendente' || statusToSend === 'pending_approval') {
          console.log('✅ [JobManagement] Usuário escolheu "Enviar para Aprovação" - FORÇANDO pending_approval');
          jobDataClean.approval_status = 'pending_approval';
          jobDataClean.status = 'draft';
        }
        // Se a vaga está ATIVA e está sendo editada (qualquer botão exceto publicar_direto)
        else if (isCurrentlyActive && submissionStatus !== 'publicar_direto') {
          console.log('✅ [JobManagement] Vaga ATIVA sendo editada - FORÇANDO pending_approval');
          jobDataClean.approval_status = 'pending_approval';
          jobDataClean.status = 'draft';
        }
        // Se a vaga estava congelada e está sendo ativada
        else if (currentJob?.flow_status === 'congelada' && jobDataClean.flow_status === 'ativa') {
          console.log('✅ [JobManagement] Vaga congelada sendo reativada - voltando para pending_approval');
          jobDataClean.approval_status = 'pending_approval';
          jobDataClean.status = 'draft';
        }
        // Se é admin escolhendo "publicar_direto", manter como active
        else if (submissionStatus === 'publicar_direto') {
          console.log('✅ [JobManagement] Admin escolheu "Publicar Direto" - mantendo como active');
          // Manter o statusToSend que já está como 'active'
        }

        console.log('🔍 [JobManagement] Status FINAL que será salvo:', {
          approval_status: jobDataClean.approval_status,
          status: jobDataClean.status,
          flow_status: jobDataClean.flow_status
        });
        console.log('🔍 [JobManagement] ===== FIM DA VERIFICAÇÃO =====');
      }

      if (!jobToSave.id) {
        delete jobDataClean.id;
        jobDataClean.created_by = user.id;
        await createJob.mutateAsync(jobDataClean);
        toast({ title: "Vaga criada com sucesso!", description: "A nova vaga foi adicionada ao sistema." });
      } else {
        console.log('💾 [JobManagement] Salvando vaga editada:', {
          id: jobToSave.id,
          approval_status: jobDataClean.approval_status,
          status: jobDataClean.status,
          flow_status: jobDataClean.flow_status
        });

        await updateJob.mutateAsync(jobDataClean);

        console.log('✅ [JobManagement] Vaga salva com sucesso! Status final:', jobDataClean.approval_status);

        toast({
          title: "Vaga atualizada com sucesso!",
          description: jobDataClean.approval_status === 'pending_approval'
            ? "A vaga foi reativada e precisa ser aprovada novamente por admin/gerente."
            : "As alterações foram salvas."
        });
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


  return (
    <Card className="p-4 shadow-lg bg-white rounded-lg">
      <CardContent className="p-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Gerenciamento de Vagas</h2>
          {!talentBankJobExists && (
            <Button variant="outline" onClick={handleCreateTalentBankJob} disabled={isCreatingTalentBank}>
              {isCreatingTalentBank ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2" />}
              Criar Banco de Talentos
            </Button>
          )}
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

          {/* Botão Nova Vaga - Centralizado */}
          <Card className="border-indigo-200 bg-indigo-50">
            <CardContent className="p-4 h-full flex items-center justify-center">
              <Button
                onClick={handleCreate}
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-semibold shadow-sm"
                size="lg"
              >
                <Plus className="mr-2 h-5 w-5" /> Nova Vaga
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              {/* Busca */}
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

              {/* Filtros por Status, Cidade e Departamento */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as vagas</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="expired">Expiradas</SelectItem>
                    <SelectItem value="completed">Concluídas</SelectItem>
                    <SelectItem value="congelada">Congeladas</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as cidades</SelectItem>
                    {uniqueCities.map(city => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os departamentos</SelectItem>
                    {uniqueDepartments.map(dept => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Botão para limpar filtros */}
                {(cityFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all' || searchTerm.trim() !== '') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCityFilter('all');
                      setDepartmentFilter('all');
                      setStatusFilter('all');
                      setSearchTerm('');
                    }}
                    className="w-full sm:w-auto"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>


        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-cgb-primary" />
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-700">Carregando vagas...</p>
              <p className="text-sm text-gray-500 mt-1">Isso pode levar alguns segundos</p>
            </div>
          </div>
        ) : jobsError ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-700">Erro ao carregar vagas</p>
              <p className="text-sm text-gray-500 mt-1">{jobsError instanceof Error ? jobsError.message : "Erro desconhecido"}</p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-4"
                variant="outline"
              >
                Recarregar Página
              </Button>
            </div>
          </div>
        ) : (
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vaga</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>CT</TableHead>
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
                      <TableCell>{job.company_contract || '-'}</TableCell>
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
              <p className="text-sm text-red-600">A vaga será marcada como excluída e pode ser recuperada posteriormente.</p>
            </div>
          </div>

          {jobToDelete && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="font-medium text-gray-900 mb-1">{jobToDelete.title}</p>
              <p className="text-sm text-gray-600">{jobToDelete.department} • {jobToDelete.city}, {jobToDelete.state}</p>
            </div>
          )}

          <p className="text-gray-700">
            Tem certeza de que deseja excluir esta vaga? Os candidatos associados continuarão no histórico.
            A vaga será marcada como excluída (soft delete) e pode ser recuperada na seção "Vagas Excluídas".
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
          <JobTitleSelect
            value={job.title || ""}
            onChange={(value) => {
              const event = { target: { name: "title", value } } as React.ChangeEvent<HTMLInputElement>;
              onFormChange(event);
            }}
            required
            maxLength={255}
            showCharCount={true}
            id="title"
          />
          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Select name="department" value={job.department} onValueChange={(value) => onSelectChange("department", value)}>
              <SelectTrigger><SelectValue placeholder="Selecione o departamento" /></SelectTrigger>
              <SelectContent>{departments.map(dep => <SelectItem key={dep} value={dep}>{dep}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_contract">CT</Label>
            <Select name="company_contract" value={job.company_contract || ""} onValueChange={(value) => onSelectChange("company_contract", value)}>
              <SelectTrigger><SelectValue placeholder="Selecione o contrato" /></SelectTrigger>
              <SelectContent>{contracts.map(contract => <SelectItem key={contract} value={contract}>{contract}</SelectItem>)}</SelectContent>
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

export default JobManagement;
