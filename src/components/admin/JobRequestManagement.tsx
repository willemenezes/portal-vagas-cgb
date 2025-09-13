import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRHProfile } from "@/hooks/useRH";
import useJobRequests, { CreateJobRequestData } from "@/hooks/useJobRequests";
import { CITIES_BY_STATE, STATES, getStateByCity, validateCityState } from "@/data/cities-states";
import { departments } from "@/data/departments";
import { WORKLOAD_OPTIONS } from "@/data/workload-options";
import JobQuantityBadge from "./JobQuantityBadge";
import {
    Plus,
    Send,
    Briefcase,
    MapPin,
    Building,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Eye,
    Loader2,
    Check,
    ChevronsUpDown,
    Trash2
} from "lucide-react";

// Interfaces para API do IBGE
interface State {
    id: number;
    sigla: string;
    nome: string;
}

interface City {
    id: number;
    nome: string;
}

export default function JobRequestManagement() {
    const { user } = useAuth();
    const { data: rhProfile } = useRHProfile(user?.id);
    const {
        jobRequests,
        stats,
        isLoading,
        createJobRequest,
        deleteJobRequest,
        isCreating: isSubmitting,
        isDeleting
    } = useJobRequests();

    const [isCreating, setIsCreating] = useState(false);
    const [cityComboOpen, setCityComboOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState<any>(null);
    const [newRequest, setNewRequest] = useState({
        title: "",
        department: "",
        city: "",
        state: "",
        type: "CLT",
        description: "",
        requirements: "",
        benefits: "",
        workload: "40h/semana",
        justification: "",
        quantity: 1,
        solicitante_nome: "",
        solicitante_funcao: "",
        observacoes_internas: "",
        tipo_solicitacao: "aumento_quadro",
        nome_substituido: ""
    });
    const { toast } = useToast();

    // Estados para busca dinâmica de cidades
    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [loadingStates, setLoadingStates] = useState(true);
    const [loadingCities, setLoadingCities] = useState(false);

    // Buscar estados do IBGE
    useEffect(() => {
        const fetchStates = async () => {
            try {
                setLoadingStates(true);
                const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
                let data = await response.json();

                // Filtrar estados se o usuário tem restrições regionais
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
        if (!newRequest.state) {
            setCities([]);
            return;
        }

        const fetchCities = async () => {
            try {
                setLoadingCities(true);

                // Primeiro buscar o ID do estado pela sigla
                const stateResponse = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${newRequest.state}`);
                const stateData = await stateResponse.json();

                if (stateData && stateData.id) {
                    // Agora buscar as cidades usando o ID do estado
                    const citiesResponse = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateData.id}/municipios?orderBy=nome`);
                    const citiesData = await citiesResponse.json();
                    setCities(citiesData);
                } else {
                    console.error("Estado não encontrado:", newRequest.state);
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
    }, [newRequest.state]);

    // Criar lista de cidades para o combobox
    const allCities = cities.map(city => ({
        value: city.nome,
        label: `${city.nome} - ${newRequest.state}`,
        state: newRequest.state
    }));

    const handleCreateRequest = async () => {
        if (!newRequest.title || !newRequest.department || !newRequest.city || !newRequest.description || !newRequest.justification) {
            toast({
                title: "Campos obrigatórios",
                description: "Preencha todos os campos obrigatórios, incluindo a justificativa",
                variant: "destructive"
            });
            return;
        }

        // Validação não é mais necessária pois usamos API do IBGE que garante compatibilidade

        const requestData: CreateJobRequestData = {
            title: newRequest.title,
            department: newRequest.department,
            city: newRequest.city,
            state: newRequest.state,
            type: newRequest.type,
            description: newRequest.description,
            requirements: newRequest.requirements.split('\n').filter(r => r.trim() !== ''),
            benefits: newRequest.benefits.split('\n').filter(b => b.trim() !== ''),
            workload: newRequest.workload,
            justification: newRequest.justification,
            quantity: newRequest.quantity,
            solicitante_nome: newRequest.solicitante_nome,
            solicitante_funcao: newRequest.solicitante_funcao,
            observacoes_internas: newRequest.observacoes_internas,
            tipo_solicitacao: newRequest.tipo_solicitacao,
            nome_substituido: newRequest.nome_substituido
        };

        // Debug: verificar se justificativa está sendo enviada
        console.log('Dados sendo enviados:', requestData);

        try {
            await createJobRequest.mutateAsync(requestData);

            setIsCreating(false);
            setCityComboOpen(false);
            setNewRequest({
                title: "",
                department: "",
                city: "",
                state: "",
                type: "CLT",
                description: "",
                requirements: "",
                benefits: "",
                workload: "40h/semana",
                justification: "",
                quantity: 1
            });
        } catch (error) {
            // Erro já tratado no hook
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'aprovado':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'rejeitado':
                return <XCircle className="w-4 h-4 text-red-600" />;
            default:
                return <AlertCircle className="w-4 h-4 text-yellow-600" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            'pendente': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'aprovado': 'bg-green-100 text-green-800 border-green-300',
            'rejeitado': 'bg-red-100 text-red-800 border-red-300'
        };

        return (
            <Badge className={variants[status] || variants.pendente}>
                {getStatusIcon(status)}
                <span className="ml-1 capitalize">{status}</span>
            </Badge>
        );
    };

    const handleDeleteRequest = (request: any) => {
        setRequestToDelete(request);
    };

    const handleConfirmDelete = async () => {
        if (!requestToDelete) return;

        try {
            await deleteJobRequest.mutateAsync(requestToDelete.id);
            setRequestToDelete(null);
        } catch (error) {
            // Erro já tratado no hook
        }
    };

    if (isCreating) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Nova Solicitação de Vaga</h2>
                        <p className="text-gray-600">Preencha os dados da vaga que deseja solicitar</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setIsCreating(false)}
                    >
                        Cancelar
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informações da Vaga</CardTitle>
                        <CardDescription>
                            Todos os campos marcados com * são obrigatórios
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título da Vaga *</Label>
                                <Input
                                    id="title"
                                    value={newRequest.title}
                                    onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                                    placeholder="Ex: Desenvolvedor Full Stack"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department">Departamento *</Label>
                                <Select
                                    value={newRequest.department}
                                    onValueChange={(value) => setNewRequest({ ...newRequest, department: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o departamento" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map(dept => (
                                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">Cidade *</Label>
                                <Popover open={cityComboOpen} onOpenChange={setCityComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={cityComboOpen}
                                            className="w-full justify-between"
                                            disabled={!newRequest.state || loadingCities}
                                        >
                                            {loadingCities ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Carregando cidades...
                                                </>
                                            ) : newRequest.city ? (
                                                allCities.find((city) => city.value === newRequest.city)?.label
                                            ) : (
                                                "Selecione a cidade..."
                                            )}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Pesquisar cidade..." />
                                            <CommandList>
                                                {loadingCities ? (
                                                    <CommandEmpty>
                                                        <div className="flex items-center justify-center py-4">
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Carregando cidades...
                                                        </div>
                                                    </CommandEmpty>
                                                ) : (
                                                    <>
                                                        <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                                                        <CommandGroup>
                                                            {allCities.map((city) => (
                                                                <CommandItem
                                                                    key={city.value}
                                                                    value={city.label}
                                                                    onSelect={() => {
                                                                        setNewRequest({ ...newRequest, city: city.value });
                                                                        setCityComboOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={`mr-2 h-4 w-4 ${newRequest.city === city.value ? "opacity-100" : "opacity-0"
                                                                            }`}
                                                                    />
                                                                    {city.label}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </>
                                                )}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {!newRequest.state && (
                                    <p className="text-xs text-gray-500">
                                        Selecione primeiro o estado
                                    </p>
                                )}
                                {loadingCities && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Carregando cidades do estado {newRequest.state}...
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">Estado *</Label>
                                <Select
                                    value={newRequest.state}
                                    onValueChange={(value) => setNewRequest({ ...newRequest, state: value, city: "" })}
                                    disabled={loadingStates}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingStates ? "Carregando estados..." : "Selecione o estado"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {states.map(state => (
                                            <SelectItem key={state.sigla} value={state.sigla}>
                                                {state.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {loadingStates && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Carregando estados...
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Tipo de Contrato</Label>
                                <Select
                                    value={newRequest.type}
                                    onValueChange={(value) => setNewRequest({ ...newRequest, type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CLT">CLT</SelectItem>
                                        <SelectItem value="Estágio">Estágio</SelectItem>
                                        <SelectItem value="Aprendiz">Aprendiz</SelectItem>
                                        <SelectItem value="Terceirizado">Terceirizado</SelectItem>
                                        <SelectItem value="Temporário">Temporário</SelectItem>
                                        <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                                        <SelectItem value="Freelancer">Freelancer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Novo campo de Quantidade de Vagas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Quantidade de Vagas *</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={newRequest.quantity || 1}
                                    onChange={(e) => setNewRequest({ ...newRequest, quantity: parseInt(e.target.value) || 1 })}
                                    placeholder="1"
                                />
                                <p className="text-xs text-blue-600">
                                    ℹ️ Quantas vagas iguais você precisa para esta cidade? (máx: 50)
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="workload">Carga Horária</Label>
                                <Select
                                    value={newRequest.workload}
                                    onValueChange={(value) => setNewRequest({ ...newRequest, workload: value })}
                                >
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
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição da Vaga *</Label>
                            <Textarea
                                id="description"
                                value={newRequest.description}
                                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                                placeholder="Descreva as principais responsabilidades e atividades da vaga..."
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="justification">Justificativa da Criação da Vaga *</Label>
                            <Textarea
                                id="justification"
                                value={newRequest.justification}
                                onChange={(e) => setNewRequest({ ...newRequest, justification: e.target.value })}
                                placeholder="Explique por que esta vaga precisa ser criada (ex: aumento da demanda, substituição, expansão do time, etc.)..."
                                rows={3}
                            />
                            <p className="text-xs text-blue-600">
                                ℹ️ Esta justificativa será vista apenas pela gerência durante a aprovação
                            </p>
                        </div>

                        {/* Campos de Controle Interno */}
                        <div className="border-t pt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">📋 Controle Interno</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="solicitante_nome">Nome do Solicitante</Label>
                                    <Input
                                        id="solicitante_nome"
                                        value={newRequest.solicitante_nome}
                                        onChange={(e) => setNewRequest({ ...newRequest, solicitante_nome: e.target.value })}
                                        placeholder="Ex: João Silva"
                                    />
                                    <p className="text-xs text-gray-500">
                                        ℹ️ Para controle interno - quem está solicitando esta vaga
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="solicitante_funcao">Função/Contrato do Solicitante</Label>
                                    <Input
                                        id="solicitante_funcao"
                                        value={newRequest.solicitante_funcao}
                                        onChange={(e) => setNewRequest({ ...newRequest, solicitante_funcao: e.target.value })}
                                        placeholder="Ex: Gerente de TI - CLT"
                                    />
                                    <p className="text-xs text-gray-500">
                                        ℹ️ Para controle interno - função e tipo de contrato
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2 mt-4">
                                <Label htmlFor="observacoes_internas">Observações Internas</Label>
                                <Textarea
                                    id="observacoes_internas"
                                    value={newRequest.observacoes_internas}
                                    onChange={(e) => setNewRequest({ ...newRequest, observacoes_internas: e.target.value })}
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
                                    value={newRequest.tipo_solicitacao}
                                    onValueChange={(value) => setNewRequest({
                                        ...newRequest,
                                        tipo_solicitacao: value,
                                        nome_substituido: value === "substituicao" ? newRequest.nome_substituido : ""
                                    })}
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
                            {newRequest.tipo_solicitacao === "substituicao" && (
                                <div className="space-y-2 mt-4">
                                    <Label htmlFor="nome_substituido">Nome da Pessoa que Saiu *</Label>
                                    <Input
                                        id="nome_substituido"
                                        value={newRequest.nome_substituido}
                                        onChange={(e) => setNewRequest({ ...newRequest, nome_substituido: e.target.value })}
                                        placeholder="Ex: Maria Santos"
                                    />
                                    <p className="text-xs text-gray-500">
                                        ℹ️ Nome da pessoa que está sendo substituída
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="requirements">Requisitos</Label>
                                <Textarea
                                    id="requirements"
                                    value={newRequest.requirements}
                                    onChange={(e) => setNewRequest({ ...newRequest, requirements: e.target.value })}
                                    placeholder="Liste os requisitos separados por linha..."
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="benefits">Benefícios</Label>
                                <Textarea
                                    id="benefits"
                                    value={newRequest.benefits}
                                    onChange={(e) => setNewRequest({ ...newRequest, benefits: e.target.value })}
                                    placeholder="Liste os benefícios separados por linha..."
                                    rows={3}
                                />
                            </div>
                        </div>


                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setIsCreating(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleCreateRequest}
                                disabled={isSubmitting}
                                className="bg-cgb-primary hover:bg-cgb-primary-dark"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Enviar Solicitação
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Solicitações de Vagas</h2>
                    <div className="space-y-1">
                        <p className="text-gray-600">Gerencie suas solicitações de novas vagas</p>
                        {rhProfile && !rhProfile.is_admin && (
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-blue-500" />
                                <span className="text-blue-600 font-medium">
                                    Região atribuída: {
                                        rhProfile.assigned_states && rhProfile.assigned_states.length > 0
                                            ? `Estados: ${rhProfile.assigned_states.join(', ')}`
                                            : rhProfile.assigned_cities && rhProfile.assigned_cities.length > 0
                                                ? `Cidades: ${rhProfile.assigned_cities.join(', ')}`
                                                : 'Todas as regiões'
                                    }
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <Button
                    onClick={() => setIsCreating(true)}
                    className="bg-cgb-primary hover:bg-cgb-primary-dark"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Solicitação
                </Button>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Pendentes</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {isLoading ? '-' : stats.pendentes}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Aprovadas</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {isLoading ? '-' : stats.aprovadas}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Rejeitadas</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {isLoading ? '-' : stats.rejeitadas}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-cgb-primary" />
                    <span className="ml-2 text-gray-600">Carregando solicitações...</span>
                </div>
            )}

            {/* Lista de Solicitações */}
            {!isLoading && jobRequests.length > 0 && (
                <div className="space-y-4">
                    {jobRequests.map((request) => (
                        <Card key={request.id}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Briefcase className="w-5 h-5 text-cgb-primary" />
                                            <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                                            {getStatusBadge(request.status)}
                                            <JobQuantityBadge
                                                quantity={request.quantity || 1}
                                                expiresAt={request.expires_at}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Building className="w-4 h-4" />
                                                <span className="text-sm">{request.department}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <MapPin className="w-4 h-4" />
                                                <span className="text-sm">{request.city}, {request.state}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-sm">{request.workload}</span>
                                            </div>
                                        </div>

                                        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                                            {request.description}
                                        </p>

                                        <div className="text-xs text-gray-500">
                                            Solicitado em: {new Date(request.created_at).toLocaleDateString('pt-BR')}
                                            {request.requested_by_name && ` por ${request.requested_by_name}`}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            Ver Detalhes
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteRequest(request)}
                                            disabled={isDeleting}
                                        >
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {!isLoading && jobRequests.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Nenhuma solicitação encontrada
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Você ainda não fez nenhuma solicitação de vaga.
                        </p>
                        <Button
                            onClick={() => setIsCreating(true)}
                            className="bg-cgb-primary hover:bg-cgb-primary-dark"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Criar Primeira Solicitação
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Modal de Confirmação de Exclusão */}
            <AlertDialog open={!!requestToDelete} onOpenChange={() => setRequestToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Solicitação</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a solicitação
                            <span className="font-bold"> "{requestToDelete?.title}"</span> e todos os seus dados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRequestToDelete(null)}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Excluindo...
                                </>
                            ) : (
                                "Excluir"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 