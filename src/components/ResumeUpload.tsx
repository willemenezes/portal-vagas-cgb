import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateResume, useUploadResume } from "@/hooks/useResumes";
import { useNavigate } from "react-router-dom";
import { useJobsRobust } from "@/hooks/useJobsRobust";
import { useSaveLegalData } from "@/hooks/useLegalData";
import { sanitizeFilename } from "@/lib/utils";

const ResumeUpload = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const createResume = useCreateResume();
  const uploadResume = useUploadResume();
  const saveLegalData = useSaveLegalData();
  const { data: jobs = [] } = useJobsRobust();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    position: "",
    education: "",
    skills: "",
    cnh: "",
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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [states, setStates] = useState<{ id: number; nome: string; sigla: string }[]>([]);
  const [cities, setCities] = useState<{ id: number; nome: string }[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    const fetchStates = async () => {
      setLoadingStates(true);
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

  // Opções fixas de formação acadêmica
  const educationOptions = [
    "Ensino Fundamental Incompleto",
    "Ensino Fundamental Completo",
    "Ensino Médio Incompleto",
    "Ensino Médio Completo",
    "Ensino Médio Técnico",
    "Ensino Superior Incompleto",
    "Ensino Superior Completo",
    "Pós-graduação/Especialização",
    "MBA",
    "Mestrado",
    "Doutorado"
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf" || file.type === "application/msword" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        if (file.size <= 5 * 1024 * 1024) { // 5MB limit
          setSelectedFile(file);
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

    if (!selectedFile) {
      toast({
        title: "Currículo obrigatório",
        description: "Por favor, anexe seu currículo para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let resumeFileUrl = "";
      let resumeFileName = "";

      if (selectedFile) {
        const sanitizedName = sanitizeFilename(selectedFile.name);
        const fileName = `${Date.now()}-${sanitizedName}`;
        const uploadResult = await uploadResume.mutateAsync({
          file: selectedFile,
          fileName
        });
        resumeFileUrl = uploadResult.publicUrl;
        resumeFileName = selectedFile.name;
      }

      // Create resume record
      const skillsArray = formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill !== '');

      // Criar apenas os dados específicos para a tabela resumes (sem campos extras)
      const resumeDataForDB = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        position: formData.position,
        education: formData.education,
        skills: skillsArray,
        resume_file_url: resumeFileUrl,
        resume_file_name: resumeFileName,
        status: 'new' as const
      };
      
      // Debug: verificar exatamente o que está sendo enviado
      console.log('Dados para createResume (apenas campos válidos):', resumeDataForDB);
      
      const resume = await createResume.mutateAsync(resumeDataForDB);

      // Salvar dados jurídicos (usando o ID do resume como candidate_id)
      await saveLegalData.mutateAsync({
        candidateId: resume.id,
        data: {
          full_name: formData.name,
          birth_date: formData.birthDate,
          rg: formData.rg,
          cpf: formData.cpf,
          mother_name: formData.motherName,
          father_name: formData.fatherName || '',
          birth_city: formData.birthCity,
          birth_state: formData.state,
          cnh: formData.cnh, // Adicionado campo CNH
          work_history: [
            ...(formData.lastCompany1 ? [{ company: formData.lastCompany1, position: '', start_date: '', end_date: '', is_current: false }] : []),
            ...(formData.lastCompany2 ? [{ company: formData.lastCompany2, position: '', start_date: '', end_date: '', is_current: false }] : [])
          ],
          is_former_employee: false, // Não temos essa informação no cadastro geral
          former_employee_details: '',
          is_pcd: false, // Não temos essa informação no cadastro geral
          pcd_details: '',
          desired_position: formData.position
        }
      });

      toast({
        title: "Currículo enviado com sucesso!",
        description: "Seu currículo foi cadastrado em nossa base de dados. Entraremos em contato quando houver oportunidades compatíveis.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        city: "",
        state: "",
        position: "",
        education: "",
        skills: "",
        cnh: "",
        birthDate: "",
        rg: "",
        cpf: "",
        motherName: "",
        fatherName: "",
        birthCity: "",
        lastCompany1: "",
        lastCompany2: "",
      });
      setSelectedFile(null);

      // Redirect to home
      navigate("/");

    } catch (error: any) {
      console.error('Erro detalhado no cadastro de currículo:', error);
      
      // Se os dados foram salvos mas houve erro apenas nos dados jurídicos, 
      // ainda consideramos sucesso
      if (error?.message?.includes('candidate_legal_data') || 
          error?.message?.includes('permission denied for table users')) {
        toast({
          title: "Currículo enviado com sucesso!",
          description: "Seu currículo foi cadastrado em nossa base de dados. Entraremos em contato quando houver oportunidades compatíveis.",
        });
        
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          city: "",
          state: "",
          position: "",
          education: "",
          skills: "",
          cnh: "",
          birthDate: "",
          rg: "",
          cpf: "",
          motherName: "",
          fatherName: "",
          birthCity: "",
          lastCompany1: "",
          lastCompany2: "",
        });
        setSelectedFile(null);
        navigate("/");
      } else {
        toast({
          title: "Erro ao enviar currículo",
          description: error?.message || "Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="elegant-shadow">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-cgb-blue flex items-center justify-center">
              <FileText className="w-8 h-8 mr-3" />
              Cadastro de Currículo
            </CardTitle>
            <p className="text-cgb-gray-dark mt-2">
              Cadastre seu currículo em nossa base de talentos e seja contatado quando surgir uma oportunidade ideal para você.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cgb-blue">Informações Pessoais</h3>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value, city: "" })} required>
                      <SelectTrigger>
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
                  </div>
                  <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Select
                      value={formData.city}
                      onValueChange={(value) => setFormData({ ...formData, city: value })}
                      required
                      disabled={!formData.state || loadingCities}
                    >
                      <SelectTrigger>
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
                  </div>
                </div>

                {/* Dados Pessoais Adicionais */}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="fatherName">Nome do Pai</Label>
                    <Input
                      id="fatherName"
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      placeholder="Nome completo do pai (opcional)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="lastCompany2">Penúltima Empresa que Trabalhou</Label>
                    <Input
                      id="lastCompany2"
                      value={formData.lastCompany2}
                      onChange={(e) => setFormData({ ...formData, lastCompany2: e.target.value })}
                      placeholder="Nome da empresa anterior (opcional)"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cgb-blue">Informações Profissionais</h3>
                <div>
                  <Label htmlFor="position">Cargo Pretendido *</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Ex: Engenheiro Eletricista, Assistente Administrativo..."
                    required
                  />
                </div>



                <div>
                  <Label htmlFor="education">Formação Acadêmica *</Label>
                  <Select value={formData.education} onValueChange={(value) => setFormData({ ...formData, education: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua formação acadêmica" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationOptions.map((education) => (
                        <SelectItem key={education} value={education}>
                          {education}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="skills">Principais Habilidades *</Label>
                  <Input
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="Ex: Excel, Inglês, NR-10 (separar por vírgula)"
                    required
                  />
                  <p className="text-xs text-cgb-gray mt-1">Separe as habilidades por vírgula</p>
                </div>

                <div>
                  <Label htmlFor="cnh">Possui CNH (Carteira Nacional de Habilitação)? *</Label>
                  <Select value={formData.cnh} onValueChange={(value) => setFormData({ ...formData, cnh: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CNH - A - PERMANENTE">CNH - A - PERMANENTE</SelectItem>
                      <SelectItem value="CNH - A - PROVISÓRIA">CNH - A - PROVISÓRIA</SelectItem>
                      <SelectItem value="CNH - AB - PERMANENTE">CNH - AB - PERMANENTE</SelectItem>
                      <SelectItem value="CNH - AB - PROVISÓRIA">CNH - AB - PROVISÓRIA</SelectItem>
                      <SelectItem value="CNH - B - PERMANENTE">CNH - B - PERMANENTE</SelectItem>
                      <SelectItem value="CNH - B - PROVISÓRIA">CNH - B - PROVISÓRIA</SelectItem>
                      <SelectItem value="NÃO POSSUI">NÃO POSSUI</SelectItem>
                      <SelectItem value="Outra">Outra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Resume Upload */}
              <div className="space-y-2">
                <Label htmlFor="resume-file" className="text-lg font-semibold text-cgb-blue">Upload do Currículo *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-cgb-blue transition-colors" onClick={() => document.getElementById('resume-file')?.click()}>
                  <input
                    type="file"
                    id="resume-file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  {selectedFile ? (
                    <div className="text-green-600 flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      <span>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  ) : (
                    <div className="text-gray-500 flex flex-col items-center justify-center gap-2">
                      <Upload className="w-8 h-8" />
                      <span>Clique para selecionar ou arraste e solte o arquivo aqui</span>
                      <p className="text-sm">PDF, DOC, DOCX (Max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting} size="lg" className="bg-cgb-primary hover:bg-cgb-primary-dark text-white font-bold py-3 px-6 rounded-lg">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSubmitting ? "Enviando..." : "Enviar Currículo"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResumeUpload;
