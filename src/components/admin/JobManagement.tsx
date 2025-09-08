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
  Edit, Plus, Eye, Trash2, Users, Loader2, Archive, ChevronsUpDown, MessageSquare, Briefcase, CheckCircle, Clock
} from "lucide-react";
import { useAllJobs, useCreateJob, useUpdateJob, useDeleteJob, Job } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { useRHProfile, RHUser } from "@/hooks/useRH";
import { useToast } from "@/hooks/use-toast";
import { useJobRequests } from "@/hooks/useJobRequests";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SimpleModal } from "@/components/ui/simple-modal";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { departments } from "@/data/departments";
import { WORKLOAD_OPTIONS } from "@/data/workload-options";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import JobQuantityBadge from "./JobQuantityBadge";

// Mapeamento de status para aparência do Badge (chaves em inglês, texto em português)
const approvalStatusConfig = {
  draft: { text: "Rascunho", variant: "secondary" as const },
  pending_approval: { text: "Pendente", variant: "warning" as const },
  active: { text: "Ativa", variant: "success" as const },
  rejected: { text: "Rejeitada", variant: "destructive" as const },
  closed: { text: "Fechada", variant: "outline" as const },
};

const JobManagement = () => {
  // Hooks de autenticação e perfil
  const { user } = useAuth();
  const { data: rhProfile } = useRHProfile(user?.id);
  const { data: allJobs = [], isLoading } = useAllJobs();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const { toast } = useToast();
  
  // Hook para job requests (apenas para RH Admin/Admin)
  const { 
    jobRequests, 
    createJobFromRequest, 
    approveAndCreateJob,
    isLoading: isLoadingRequests 
  } = useJobRequests();

  // Filtrar vagas por região se não for admin
  const jobs = allJobs.filter(job => {
    if (!rhProfile || !job) return true;
    if (typeof rhProfile === 'object' && 'is_admin' in rhProfile && rhProfile.is_admin) return true;
    if (typeof rhProfile === 'object') {
      if ('assigned_states' in rhProfile && Array.isArray(rhProfile.assigned_states)) {
        return rhProfile.assigned_states.includes(job.state);
      }
      if ('assigned_cities' in rhProfile && Array.isArray(rhProfile.assigned_cities)) {
        return rhProfile.assigned_cities.includes(job.city);
      }
    }
    return true;
  });

  const [formData, setFormData] = useState<Job | null>(null);
  const [requirementsText, setRequirementsText] = useState('');
  const [benefitsText, setBenefitsText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingTalentBank, setIsCreatingTalentBank] = useState(false);

  // Filtrar job requests aprovadas que ainda não foram convertidas em vagas
  const approvedRequests = jobRequests?.filter(request => 
    request.status === 'aprovado' && 
    !request.job_created
  ) || [];

  const talentBankJobExists = jobs.some(job => job.title === "Banco de Talentos");

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
          <DialogContent className="max-w-4xl">
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

        {/* Seção de Job Requests Aprovadas (apenas para RH Admin/Admin) */}
        {(rhProfile?.role === 'admin' || rhProfile?.is_admin) && approvedRequests.length > 0 && (
          <div className="mb-6">
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  Solicitações Aprovadas para Criação
                  <Badge variant="secondary" className="ml-2">
                    {approvedRequests.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {approvedRequests.map((request) => (
                    <div key={request.id} className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{request.title}</h3>
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              Aprovado
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              <span>{request.department}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{request.city}, {request.state}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{request.workload}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              <span>Aprovado por: {request.approved_by}</span>
                            </div>
                          </div>

                          {request.notes && (
                            <div className="text-sm text-gray-600 mb-3">
                              <p className="font-medium mb-1">Observações do Gerente:</p>
                              <p className="text-gray-500">{request.notes}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleCreateJobFromRequest(request.id)}
                            className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                            disabled={createJobFromRequest.isPending}
                          >
                            <Plus className="w-4 h-4" />
                            Criar Vaga
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                {jobs.map((job) => {
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
                          />
                        </div>
                      </TableCell>
                      <TableCell>{job.department}</TableCell>
                      <TableCell>{job.city}, {job.state}</TableCell>
                      <TableCell>{job.applicants || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
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
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(job.id!)}><Trash2 className="w-4 h-4" /></Button>
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
      </CardContent>
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
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${job.state}/municipios?orderBy=nome`);
        const data = await response.json();
        setCities(data);
      } catch (error) {
        console.error("Erro ao buscar cidades:", error);
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
            <Input name="title" value={job.title} onChange={onFormChange} required />
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
                      ? "Carregando..."
                      : (job.city ? job.city : "Selecione a cidade")
                    }
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Buscar cidade..." />
                  <CommandList>
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
