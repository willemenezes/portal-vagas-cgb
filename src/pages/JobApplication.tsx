import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import { useJobById, useJobs } from "@/hooks/useJobs";
import { useCreateCandidate } from "@/hooks/useCandidates";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useUploadResume } from "@/hooks/useResumes";
import { useSaveLegalData } from "@/hooks/useLegalData";
import { sanitizeFilename } from "@/lib/utils";

const JobApplication = () => {
  const { id: jobIdFromUrl } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: job, isLoading: jobLoading } = useJobById(jobIdFromUrl!);
  const { data: jobs, isLoading: jobsLoading } = useJobs();
  const createCandidate = useCreateCandidate();
  const uploadResume = useUploadResume();
  const saveLegalData = useSaveLegalData();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submissionProgress, setSubmissionProgress] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    age: "",
    workedAtCGB: "",
    whatsapp: "",
    emailInfo: "",
    desiredJob: "",
    pcd: "",
    travel: "",
    cnh: "",
    vehicle: "",
    vehicleModel: "",
    vehicleYear: "",
    lgpdConsent: false,
    // Novos campos obrigatórios
    birthDate: "",
    rg: "",
    cpf: "",
    motherName: "",
    fatherName: "",
    birthCity: "",
    lastCompany1: "",
    lastCompany2: "",
  });

  const [states, setStates] = useState<{ id: number; nome: string; sigla: string }[]>([]);
  const [cities, setCities] = useState<{ id: number; nome: string }[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        const data = await response.json();
        setStates(data);
      } catch (error) {
        console.error("Erro ao buscar estados:", error);
      } finally {
        setLoadingStates(false);
      }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    if (!formData.state) {
      setCities([]);
      return;
    }
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios?orderBy=nome`);
        const data = await response.json();
        setCities(data);
      } catch (error) {
        console.error("Erro ao buscar cidades:", error);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [formData.state]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf" || file.type === "application/msword" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        if (file.size <= 5 * 1024 * 1024) { // 5MB limit
          setSelectedFile(file);
          setFormError(null);
        } else {
          toast({
            title: "Arquivo muito grande",
            description: "O arquivo deve ter no máximo 5MB",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Formato não suportado",
          description: "Apenas arquivos PDF, DOC e DOCX são aceitos",
          variant: "destructive"
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    if (!selectedFile) {
      toast({
        title: "Currículo obrigatório",
        description: "Por favor, anexe seu currículo para enviar a candidatura.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Validação de e-mail
    if (formData.email !== formData.emailInfo) {
      setFormError("Os endereços de e-mail não coincidem. Por favor, verifique.");
      setIsSubmitting(false);
      toast({
        title: "Erro de validação",
        description: "Os e-mails informados não são iguais.",
        variant: "destructive",
      });
      return;
    }

    let targetJobId = jobIdFromUrl;

    // Se não houver ID na URL, significa que é o formulário geral (potencialmente para o banco de talentos)
    if (!targetJobId) {
      const talentBankJob = jobs?.find(j => j.title === "Banco de Talentos");
      if (talentBankJob) {
        targetJobId = talentBankJob.id;
      } else {
        setFormError("A vaga do Banco de Talentos não foi encontrada. Tente novamente mais tarde.");
        setIsSubmitting(false);
        toast({
          title: "Erro",
          description: "Não foi possível encontrar a vaga do Banco de Talentos.",
          variant: "destructive",
        });
        return;
      }
    }

    // 🔧 MELHORIA: Implementar retry automático para resolver "Failed to fetch"
    const maxRetries = 3;
    let retryCount = 0;

    const attemptSubmission = async (): Promise<void> => {
      try {
        console.log(`🔄 [JobApplication] Tentativa ${retryCount + 1}/${maxRetries} de envio da candidatura`);

        let resumeFileUrl = "";
        let resumeFileName = "";
        
        // Upload do currículo com retry
        if (selectedFile) {
          setSubmissionProgress("📤 Fazendo upload do currículo...");
          const sanitizedName = sanitizeFilename(selectedFile.name);
          const fileName = `${Date.now()}-${sanitizedName}`;
          
          try {
            const uploadResult = await uploadResume.mutateAsync({ file: selectedFile, fileName });
            resumeFileUrl = uploadResult.publicUrl;
            resumeFileName = selectedFile.name;
            console.log(`✅ [JobApplication] Upload do currículo realizado com sucesso`);
            setSubmissionProgress("✅ Currículo enviado com sucesso!");
          } catch (uploadError: any) {
            console.error(`❌ [JobApplication] Erro no upload do currículo:`, uploadError);
            throw new Error(`Erro ao fazer upload do currículo: ${uploadError.message || 'Falha na conexão'}`);
          }
        }

        // Criar candidato com retry
        setSubmissionProgress("👤 Criando perfil do candidato...");
        const candidate = await createCandidate.mutateAsync({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          state: formData.state,
          job_id: targetJobId,
          status: 'pending' as const,
          // Persistir informações críticas para filtros e decisões
          pcd: formData.pcd || null,
          travel: formData.travel || null,
          age: formData.age || null,
          cnh: formData.cnh || null,
          vehicle: formData.vehicle || null,
          vehicle_model: formData.vehicleModel || null,
          vehicle_year: formData.vehicleYear || null,
          resume_file_url: resumeFileUrl || null,
          resume_file_name: resumeFileName || null
        });

        console.log(`✅ [JobApplication] Candidato criado com sucesso: ${candidate.id}`);
        setSubmissionProgress("✅ Perfil criado com sucesso!");

        // Salvar dados jurídicos - com tratamento de erro melhorado
        setSubmissionProgress("⚖️ Salvando dados jurídicos...");
        try {
          await saveLegalData.mutateAsync({
            candidateId: candidate.id,
            data: {
              full_name: formData.name,
              birth_date: formData.birthDate,
              rg: formData.rg,
              cpf: formData.cpf,
              mother_name: formData.motherName,
              father_name: formData.fatherName || '',
              birth_city: formData.birthCity,
              birth_state: formData.state,
              cnh: formData.cnh,
              work_history: [
                ...(formData.lastCompany1 ? [{ company: formData.lastCompany1, position: '', start_date: '', end_date: '', is_current: false }] : []),
                ...(formData.lastCompany2 ? [{ company: formData.lastCompany2, position: '', start_date: '', end_date: '', is_current: false }] : [])
              ],
              is_former_employee: formData.workedAtCGB === 'Sim',
              former_employee_details: formData.workedAtCGB === 'Sim' ? 'Informado no formulário' : '',
              is_pcd: formData.pcd === 'Sim',
              pcd_details: formData.pcd === 'Sim' ? 'Informado no formulário' : '',
              desired_position: formData.desiredJob || job?.title || 'Vaga não especificada',
              responsible_name: null
            }
          });
          console.log(`✅ [JobApplication] Dados jurídicos salvos com sucesso`);
          setSubmissionProgress("✅ Dados jurídicos salvos!");
        } catch (legalDataError: any) {
          console.warn('⚠️ [JobApplication] Erro ao salvar dados jurídicos, mas candidato foi criado:', legalDataError);
          setSubmissionProgress("⚠️ Candidato criado, mas dados jurídicos com problema");
          // Candidato já foi criado com sucesso, continua o fluxo
        }

        // Sucesso! Não precisa mais tentar
        setSubmissionProgress("🎉 Candidatura enviada com sucesso!");
        toast({
          title: "Candidatura enviada com sucesso!",
          description: "Seu currículo foi enviado. Entraremos em contato em breve.",
        });
        navigate("/");

      } catch (error: any) {
        console.error(`❌ [JobApplication] Erro na tentativa ${retryCount + 1}:`, error);
        
        // Verificar se é um erro de rede que vale a pena tentar novamente
        const isRetryableError = error?.message?.includes('fetch') || 
                                 error?.message?.includes('network') ||
                                 error?.message?.includes('timeout') ||
                                 error?.code === 'NETWORK_ERROR' ||
                                 error?.name === 'TypeError';

        if (isRetryableError && retryCount < maxRetries - 1) {
          retryCount++;
          console.log(`🔄 [JobApplication] Tentando novamente em 2 segundos... (${retryCount}/${maxRetries})`);
          
          // Aguardar antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 2000));
          return attemptSubmission();
        } else {
          // Erro final ou não é retryable
          throw error;
        }
      }
    };

    try {
      await attemptSubmission();
    } catch (error: any) {
      console.error('❌ [JobApplication] Erro final após todas as tentativas:', error);

      // Mensagens de erro mais específicas para o usuário
      let errorMessage = "Tente novamente mais tarde.";
      
      if (error?.message?.includes('fetch') || error?.message?.includes('Failed to fetch')) {
        errorMessage = "Problema de conexão. Verifique sua internet e tente novamente.";
      } else if (error?.message?.includes('timeout')) {
        errorMessage = "A operação demorou muito para responder. Tente novamente.";
      } else if (error?.message?.includes('network')) {
        errorMessage = "Erro de rede. Verifique sua conexão e tente novamente.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro ao enviar candidatura",
        description: errorMessage,
        variant: "destructive",
      });

      // Mostrar erro também no formulário
      setFormError(`Erro: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
      setSubmissionProgress("");
    }
  };

  // This effect hook is crucial. It listens for when the `job` data is loaded.
  // Once `job` is available, it populates the form state (`formData`) with the
  // job's title, state, and city. This ensures the fields are pre-filled correctly.
  useEffect(() => {
    // Popula o formulário com os dados da vaga quando ela é carregada
    if (job && states.length > 0) {
      const stateObject = states.find(s => s.nome.toLowerCase() === job.state?.toLowerCase());
      const stateAbbreviation = stateObject ? stateObject.sigla : '';

      setFormData(prev => ({
        ...prev,
        desiredJob: job.title || '',
        state: stateAbbreviation,
        city: job.city || '',
      }));
    }
  }, [job, states]);

  const handleVehicleChange = (value: string) => {
    if (value === 'Não possuo') {
      setFormData({
        ...formData,
        vehicle: value,
        vehicleModel: 'N/A',
        vehicleYear: 'N/A',
      });
    } else {
      setFormData({ ...formData, vehicle: value });
    }
  };

  if (jobLoading && jobIdFromUrl) {
    return (
      <div className="min-h-screen bg-cgb-cream">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cgb-blue" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-cgb-cream">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="outline"
            onClick={() => navigate(jobIdFromUrl ? `/vaga/${jobIdFromUrl}` : '/')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {jobIdFromUrl ? 'Voltar à vaga' : 'Voltar ao início'}
          </Button>

          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-cgb-blue">
                  Candidatar-se para: {job?.title || 'Banco de Talentos'}
                </CardTitle>
                <p className="text-cgb-gray-dark">
                  {job ? `${job.department} • ${job.city}, ${job.state}` : 'Deixe seu currículo para futuras oportunidades'}
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(91) 99999-9999"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="state">Estado *</Label>
                      {jobIdFromUrl ? (
                        <div className="flex items-center h-10 px-3 py-2 text-sm border border-input bg-muted rounded-md">
                          <span className="text-foreground font-medium">
                            {states.find(s => s.sigla === formData.state)?.nome || formData.state}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">(Pré-selecionado pela vaga)</span>
                        </div>
                      ) : (
                        <Select
                          value={formData.state}
                          onValueChange={(value) => setFormData({ ...formData, state: value, city: "" })}
                          required
                          disabled={loadingStates}
                        >
                          <SelectTrigger id="state">
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingStates ? (
                              <SelectItem value="loading" disabled>Carregando...</SelectItem>
                            ) : (
                              states.map((s) => (
                                <SelectItem key={s.id} value={s.sigla}>
                                  {s.nome}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      {!jobIdFromUrl && !formData.state && (
                        <div style={{ color: 'red', fontSize: 12, marginTop: 6 }}>Campo obrigatório</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="city">Cidade *</Label>
                      {jobIdFromUrl ? (
                        <div className="flex items-center h-10 px-3 py-2 text-sm border border-input bg-muted rounded-md">
                          <span className="text-foreground font-medium">
                            {formData.city}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">(Pré-selecionada pela vaga)</span>
                        </div>
                      ) : (
                        <Select
                          value={formData.city}
                          onValueChange={(value) => setFormData({ ...formData, city: value })}
                          required
                          disabled={!formData.state || loadingCities}
                        >
                          <SelectTrigger id="city">
                            <SelectValue placeholder="Selecione a cidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingCities ? (
                              <SelectItem value="loading" disabled>Carregando...</SelectItem>
                            ) : cities.length > 0 ? (
                              cities.map((c) => (
                                <SelectItem key={c.id} value={c.nome}>
                                  {c.nome}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-cities" disabled>
                                Selecione um estado primeiro
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      {!jobIdFromUrl && !formData.city && (
                        <div style={{ color: 'red', fontSize: 12, marginTop: 6 }}>Campo obrigatório</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="age">Idade *</Label>
                    <Input
                      id="age"
                      type="number"
                      min="16"
                      value={formData.age}
                      onChange={e => setFormData({ ...formData, age: e.target.value })}
                      required
                    />
                  </div>

                  {/* Seção: Dados Pessoais Adicionais */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-cgb-blue mb-4">Dados Pessoais Adicionais</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="birthDate">Data de Nascimento *</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={formData.birthDate}
                          onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="birthCity">Cidade que Nasceu *</Label>
                        <Input
                          id="birthCity"
                          value={formData.birthCity}
                          onChange={(e) => setFormData({ ...formData, birthCity: e.target.value })}
                          placeholder="Ex: São Paulo"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="rg">RG *</Label>
                        <Input
                          id="rg"
                          value={formData.rg}
                          onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                          placeholder="Ex: 12.345.678-9"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input
                          id="cpf"
                          value={formData.cpf}
                          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                          placeholder="Ex: 123.456.789-00"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="motherName">Nome da Mãe *</Label>
                        <Input
                          id="motherName"
                          value={formData.motherName}
                          onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                          placeholder="Nome completo da mãe"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="fatherName">Nome do Pai *</Label>
                        <Input
                          id="fatherName"
                          value={formData.fatherName}
                          onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                          placeholder="Nome completo do pai"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="lastCompany1">Última Empresa que Trabalhou *</Label>
                        <Input
                          id="lastCompany1"
                          value={formData.lastCompany1}
                          onChange={(e) => setFormData({ ...formData, lastCompany1: e.target.value })}
                          placeholder="Nome da empresa mais recente"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastCompany2">Penúltima Empresa que Trabalhou *</Label>
                        <Input
                          id="lastCompany2"
                          value={formData.lastCompany2}
                          onChange={(e) => setFormData({ ...formData, lastCompany2: e.target.value })}
                          placeholder="Nome da empresa anterior"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Já trabalhou ou trabalha no Grupo CGB? *</Label>
                    <div className="flex gap-4 mt-1">
                      <label className="flex items-center gap-1">
                        <input type="radio" name="workedAtCGB" value="Sim" checked={formData.workedAtCGB === "Sim"} onChange={e => setFormData({ ...formData, workedAtCGB: e.target.value })} required /> Sim
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="radio" name="workedAtCGB" value="Não" checked={formData.workedAtCGB === "Não"} onChange={e => setFormData({ ...formData, workedAtCGB: e.target.value })} /> Não
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="whatsapp">WhatsApp *</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="emailInfo">E-mail (para receber informações sobre a vaga) *</Label>
                    <Input
                      id="emailInfo"
                      type="email"
                      value={formData.emailInfo}
                      onChange={e => setFormData({ ...formData, emailInfo: e.target.value })}
                      required
                    />
                  </div>

                  {formError && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                      {formError}
                    </div>
                  )}

                  {isSubmitting && submissionProgress && (
                    <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{submissionProgress}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="desiredJob">Vaga que deseja concorrer *</Label>
                    {jobIdFromUrl && job ? (
                      <div className="flex items-center h-10 px-3 py-2 text-sm border border-input bg-muted rounded-md">
                        <span className="text-foreground font-medium">
                          {job.title} - {job.city}, {job.state}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">(Pré-selecionada)</span>
                      </div>
                    ) : (
                      <Select
                        value={formData.desiredJob}
                        onValueChange={value => setFormData({ ...formData, desiredJob: value })}
                        required
                        disabled={jobsLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={jobsLoading ? "Carregando vagas..." : "Selecione a vaga"} />
                        </SelectTrigger>
                        <SelectContent>
                          {jobs && jobs.length > 0 && (
                            jobs.map((job) => (
                              <SelectItem key={job.id} value={job.title}>{job.title} - {job.city}, {job.state}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    {jobs && jobs.length === 0 && !jobIdFromUrl && (
                      <div style={{ color: 'red', marginTop: 8 }}>Nenhuma vaga disponível</div>
                    )}
                  </div>

                  <div>
                    <Label>É pessoa com deficiência? *</Label>
                    <div className="flex gap-4 mt-1">
                      <label className="flex items-center gap-1">
                        <input type="radio" name="pcd" value="Sim" checked={formData.pcd === "Sim"} onChange={e => setFormData({ ...formData, pcd: e.target.value })} required /> Sim
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="radio" name="pcd" value="Não" checked={formData.pcd === "Não"} onChange={e => setFormData({ ...formData, pcd: e.target.value })} /> Não
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label>Disponibilidade de Viagens? *</Label>
                    <div className="flex gap-4 mt-1">
                      <label className="flex items-center gap-1">
                        <input type="radio" name="travel" value="Sim" checked={formData.travel === "Sim"} onChange={e => setFormData({ ...formData, travel: e.target.value })} required /> Sim
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="radio" name="travel" value="Não" checked={formData.travel === "Não"} onChange={e => setFormData({ ...formData, travel: e.target.value })} /> Não
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label>Possui CNH (Carteira Nacional de Habilitação)? *</Label>
                    <select
                      name="cnh"
                      required
                      value={formData.cnh}
                      onChange={e => setFormData({ ...formData, cnh: e.target.value })}
                      className="input"
                    >
                      <option value="">Selecione</option>
                      <option value="CNH - A - PERMANENTE">CNH - A - PERMANENTE</option>
                      <option value="CNH - A - PROVISÓRIA">CNH - A - PROVISÓRIA</option>
                      <option value="CNH - AB - PERMANENTE">CNH - AB - PERMANENTE</option>
                      <option value="CNH - AB - PROVISÓRIA">CNH - AB - PROVISÓRIA</option>
                      <option value="CNH - B - PERMANENTE">CNH - B - PERMANENTE</option>
                      <option value="CNH - B - PROVISÓRIA">CNH - B - PROVISÓRIA</option>
                      <option value="NÃO POSSUI">NÃO POSSUI</option>
                      <option value="Outra">Outra</option>
                    </select>
                  </div>

                  <div>
                    <Label>Possui Veículo? *</Label>
                    <select
                      name="vehicle"
                      required
                      value={formData.vehicle}
                      onChange={e => handleVehicleChange(e.target.value)}
                      className="input"
                    >
                      <option value="">Selecione</option>
                      <option value="Carro">Carro</option>
                      <option value="Moto">Moto</option>
                      <option value="Não possuo">Não possuo</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="vehicleModel">Qual modelo do veículo? *</Label>
                    <Input
                      id="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })}
                      disabled={formData.vehicle === 'Não possuo'}
                      required={formData.vehicle !== 'Não possuo'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="vehicleYear">Qual o ano do veículo? *</Label>
                    <Input
                      id="vehicleYear"
                      type="number"
                      value={formData.vehicleYear}
                      onChange={e => setFormData({ ...formData, vehicleYear: e.target.value })}
                      disabled={formData.vehicle === 'Não possuo'}
                      required={formData.vehicle !== 'Não possuo'}
                    />
                  </div>

                  <div className="mt-6 mb-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="lgpdConsent"
                        required
                        checked={formData.lgpdConsent}
                        onChange={e => setFormData({ ...formData, lgpdConsent: e.target.checked })}
                        onInvalid={e => e.currentTarget.setCustomValidity('Você precisa concordar com o uso dos dados para enviar seu currículo.')}
                        onInput={e => e.currentTarget.setCustomValidity('')}
                      />
                      <span>
                        Eu, titular tenho conhecimento e autorizo que a empresa GRUPO CGB disponha dos meus dados pessoais, de acordo com os artigos 7° da Lei n° 13.709/2018 para fins de seleção que serão. pelo período de 12 meses, especificamente para participação de seleção e recrutamento para vaga de emprego, podendo compartilhar os dados com empresas que auxiliam na realização de recrutamento. <b>CONCORDO</b>
                      </span>
                    </label>
                  </div>

                  <div>
                    <Label htmlFor="resume-file">Upload do Currículo *</Label>
                    <div className="border-2 border-dashed border-cgb-silver rounded-lg p-6 text-center mb-2">
                      <input
                        type="file"
                        id="resume-file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="resume-file"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        {selectedFile ? (
                          <>
                            <span className="text-cgb-green font-medium">{selectedFile.name}</span>
                            <span className="text-sm text-cgb-gray">Arquivo selecionado com sucesso</span>
                          </>
                        ) : (
                          <>
                            <span className="text-cgb-gray-dark">Clique para fazer upload do seu currículo</span>
                            <span className="text-sm text-cgb-gray">PDF, DOC ou DOCX (máximo 5MB)</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-6 justify-end border-t border-gray-100 pb-4 mt-8">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        background: isSubmitting ? '#999' : '#6a0b27',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        padding: '16px 40px',
                        borderRadius: '999px',
                        boxShadow: '0 2px 8px rgba(106,11,39,0.12)',
                        border: 'none',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s, box-shadow 0.2s',
                        outline: 'none',
                        opacity: isSubmitting ? 0.7 : 1,
                      }}
                      onMouseOver={e => !isSubmitting && (e.currentTarget.style.background = '#4a0820')}
                      onMouseOut={e => !isSubmitting && (e.currentTarget.style.background = '#6a0b27')}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Enviando...
                        </div>
                      ) : (
                        'Enviar Currículo'
                      )}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobApplication;
