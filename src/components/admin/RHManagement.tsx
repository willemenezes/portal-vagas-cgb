import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRHUsers, useRHProfile, useCreateRHUser, useUpdateRHUser, useDeleteRHUser, useResetRHUserPassword, RHUser, NewRHUser } from "@/hooks/useRH";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, UserPlus, Edit, Trash2, Loader2, Key, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

const statesAndCities = {
    "PA": ["Belém", "Ananindeua", "Santarém", "Marabá", "Castanhal", "Abaetetuba", "Cametá", "Marituba", "Parauapebas", "Altamira"],
    "AP": ["Macapá", "Santana", "Laranjal do Jari", "Oiapoque", "Mazagão"]
};

// Componente principal
const RHManagement = () => {
    const { user } = useAuth();
    const { data: rhProfile, isLoading: isLoadingProfile } = useRHProfile(user?.id);
    const createRHUser = useCreateRHUser();
    const { toast } = useToast();

    const handleCreateAdminProfile = () => {
        if (!user || !user.id || !user.email) {
            toast({ title: "Erro", description: "Informações do usuário não encontradas.", variant: "destructive" });
            return;
        }
        const adminProfile: NewRHUser = {
            user_id: user.id,
            email: user.email,
            full_name: user.user_metadata.full_name || "Admin Principal",
            is_admin: true,
            assigned_states: null,
            assigned_cities: null,
        };
        createRHUser.mutate(adminProfile, {
            onSuccess: () => toast({ title: "Sucesso!", description: "Seu perfil de administrador foi criado." }),
            onError: (error) => toast({ title: "Erro ao criar perfil", description: error.message, variant: "destructive" }),
        });
    };

    if (isLoadingProfile) {
        return <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin" /> Carregando seu perfil...</div>;
    }

    if (!rhProfile) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Configurar Acesso de Administrador</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="mb-4">Para começar a gerenciar a equipe de RH, você precisa primeiro criar seu próprio perfil de administrador.</p>
                    <Button onClick={handleCreateAdminProfile} disabled={createRHUser.isPending}>
                        {createRHUser.isPending ? <Loader2 className="animate-spin mr-2" /> : <Shield className="mr-2" />}
                        Criar Meu Perfil de Admin
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!rhProfile.is_admin) {
        return (
            <Card>
                <CardHeader><CardTitle className="text-destructive">Acesso Negado</CardTitle></CardHeader>
                <CardContent>Você não tem permissão para gerenciar a equipe de RH.</CardContent>
            </Card>
        );
    }

    return <RHManagementPanel />;
};

// Diálogo para adicionar/editar usuário
const AddUserDialog = ({ onSave, userToEdit, isOpen, onOpenChange, isLoading }: {
    onSave: (user: NewRHUser | RHUser) => void,
    userToEdit?: RHUser | null,
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    isLoading?: boolean
}) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedStates, setSelectedStates] = useState<string[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);

    // Estados para carregar dados do IBGE
    const [ibgeStates, setIbgeStates] = useState<{ id: number; nome: string; sigla: string }[]>([]);
    const [ibgeCities, setIbgeCities] = useState<{ id: number; nome: string }[]>([]);
    const [loadingIbgeStates, setLoadingIbgeStates] = useState(false);
    const [loadingIbgeCities, setLoadingIbgeCities] = useState(false);
    const [statesWithCities, setStatesWithCities] = useState<Record<string, { id: number; nome: string }[]>>({});

    useEffect(() => {
        setFullName(userToEdit?.full_name || '');
        setEmail(userToEdit?.email || '');
        setIsAdmin(userToEdit?.is_admin || false);
        setSelectedStates(userToEdit?.assigned_states || []);
        setSelectedCities(userToEdit?.assigned_cities || []);
        setPassword('');
        setConfirmPassword('');
    }, [userToEdit, isOpen]);


    useEffect(() => {
        const fetchStates = async () => {
            setLoadingIbgeStates(true);
            try {
                const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
                const data = await response.json();
                setIbgeStates(data);
            } catch (error) {
                console.error("Erro ao buscar estados do IBGE:", error);
            } finally {
                setLoadingIbgeStates(false);
            }
        };
        if (isOpen && !isAdmin) {
            fetchStates();
        }
    }, [isOpen, isAdmin]);

    const handleStateChange = (state: string, checked: boolean) => {
        const newSelectedStates = checked ? [...selectedStates, state] : selectedStates.filter(s => s !== state);
        setSelectedStates(newSelectedStates);

        if (checked && !statesWithCities[state]) {
            // Fetch cities for the newly selected state
            const fetchCities = async () => {
                setLoadingIbgeCities(true);
                try {
                    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios?orderBy=nome`);
                    const data = await response.json();
                    setStatesWithCities(prev => ({ ...prev, [state]: data }));
                } catch (error) {
                    console.error(`Erro ao buscar cidades para ${state}:`, error);
                } finally {
                    setLoadingIbgeCities(false);
                }
            };
            fetchCities();
        } else if (!checked) {
            // Desmarcar cidades do estado que foi desmarcado
            const citiesOfState = statesWithCities[state]?.map(c => c.nome) || [];
            setSelectedCities(selectedCities.filter(c => !citiesOfState.includes(c)));
        }
    };


    const handleCityChange = (city: string, checked: boolean) => {
        setSelectedCities(checked ? [...selectedCities, city] : selectedCities.filter(c => c !== city));
    };

    const handleSubmit = () => {
        console.log('🔥 handleSubmit chamado no AddUserDialog');

        console.log('📋 Dados atuais do formulário:', {
            fullName,
            email,
            password,
            confirmPassword,
            isAdmin,
            selectedStates,
            selectedCities,
            userToEdit
        });

        // Validações para novos usuários
        if (!userToEdit) {
            console.log('🔍 Validando novo usuário...');
            if (!password || password.length < 6) {
                console.log('❌ Senha inválida');
                alert('A senha deve ter pelo menos 6 caracteres.');
                return;
            }
            if (password !== confirmPassword) {
                console.log('❌ Senhas não coincidem');
                alert('As senhas não coincidem.');
                return;
            }
        }

        console.log('✅ Validações passaram, criando userData...');

        const userData = {
            ...userToEdit,
            full_name: fullName,
            email,
            is_admin: isAdmin,
            assigned_states: isAdmin ? null : selectedStates,
            assigned_cities: isAdmin ? null : selectedCities,
            // Incluir senha apenas para novos usuários
            ...((!userToEdit && password) && { password }),
        };

        if (!userToEdit) {
            const newUser: NewRHUser & { password?: string } = {
                email,
                full_name: fullName,
                is_admin: isAdmin,
                assigned_states: isAdmin ? null : selectedStates,
                assigned_cities: isAdmin ? null : selectedCities,
                password,
            };
            console.log('🚀 Chamando onSave com novo usuário:', newUser);
            console.log('🚀 Tipo de onSave:', typeof onSave);

            try {
                onSave(newUser);
                console.log('✅ onSave executado sem erro');
            } catch (error) {
                console.error('💥 Erro ao chamar onSave:', error);
            }
        } else {
            console.log('✏️ Chamando onSave para editar usuário:', userData);
            onSave(userData as RHUser);
        }

        console.log('📤 onSave chamado...');
        // onOpenChange(false); // NÃO fechar aqui. O diálogo deve ser fechado no onSuccess da mutation.
    };

    // Reset state when dialog opens for a new user
    const handleOpenChange = (open: boolean) => {
        if (open && !userToEdit) {
            setFullName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setIsAdmin(false);
            setSelectedStates([]);
            setSelectedCities([]);
        }
        onOpenChange(open);
    }


    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" /> Adicionar Membro
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{userToEdit ? 'Editar Membro da Equipe' : 'Adicionar Novo Membro à Equipe de RH'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nome Completo</Label>
                        <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="col-span-3" />
                    </div>

                    {/* Campos de senha apenas para novos usuários */}
                    {!userToEdit && (
                        <>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="password" className="text-right">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="col-span-3"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="confirmPassword" className="text-right">Confirmar Senha</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="col-span-3"
                                    placeholder="Digite a senha novamente"
                                />
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Nível de Acesso</Label>
                        <Select onValueChange={(value) => setIsAdmin(value === 'admin')} defaultValue={isAdmin ? 'admin' : 'recruiter'}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione o nível" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin (Acesso Total)</SelectItem>
                                <SelectItem value="recruiter">Recrutador (Acesso Restrito)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {!isAdmin && (
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">Regiões de Acesso</Label>
                            <div className="col-span-3 border rounded-md p-4 max-h-60 overflow-y-auto">
                                {loadingIbgeStates && <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Carregando estados...</div>}
                                {ibgeStates.map((state) => (
                                    <div key={state.sigla}>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`state-${state.sigla}`}
                                                checked={selectedStates.includes(state.sigla)}
                                                onCheckedChange={(checked) => handleStateChange(state.sigla, !!checked)}
                                            />
                                            <label htmlFor={`state-${state.sigla}`} className="font-bold">{state.nome} ({state.sigla})</label>
                                        </div>
                                        {selectedStates.includes(state.sigla) && (
                                            <div className="grid grid-cols-2 gap-2 pl-6 mt-2">
                                                {loadingIbgeCities && !statesWithCities[state.sigla] && <div className="col-span-2 flex items-center gap-2 text-sm"><Loader2 className="w-3 h-3 animate-spin" />Carregando cidades...</div>}
                                                {statesWithCities[state.sigla]?.map(city => (
                                                    <div key={city.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`city-${city.id}`}
                                                            checked={selectedCities.includes(city.nome)}
                                                            onCheckedChange={(checked) => handleCityChange(city.nome, !!checked)}
                                                        />
                                                        <label htmlFor={`city-${city.id}`} className="text-sm">{city.nome}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 pt-4">
                    <Button
                        type="button"
                        disabled={isLoading}
                        className="flex-1"
                        onClick={handleSubmit}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            'Salvar'
                        )}
                    </Button>
                    {isLoading && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                console.log('🛑 Usuário cancelou operação');
                                onOpenChange(false);
                            }}
                            className="px-4"
                        >
                            Cancelar
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Painel de gerenciamento para admins
const RHManagementPanel = () => {
    const { user: currentUser } = useAuth();
    const { data: rhUsers = [], isLoading: isLoadingUsers, refetch } = useRHUsers();
    const createRHUser = useCreateRHUser();
    const updateRHUser = useUpdateRHUser();
    const deleteRHUser = useDeleteRHUser();
    const resetRHUserPassword = useResetRHUserPassword();
    const { toast } = useToast();

    const [userToEdit, setUserToEdit] = useState<RHUser | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<RHUser | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [newUserCredentials, setNewUserCredentials] = useState<{ email: string, password: string, name: string } | null>(null);
    const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);

    // Estados para reset de senha
    const [userToResetPassword, setUserToResetPassword] = useState<RHUser | null>(null);
    const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [resetPasswordCredentials, setResetPasswordCredentials] = useState<{ email: string, password: string, name: string } | null>(null);
    const [isResetPasswordResultDialogOpen, setIsResetPasswordResultDialogOpen] = useState(false);

    const handleEditClick = (user: RHUser) => {
        setUserToEdit(user);
        setIsDialogOpen(true);
    };

    const handleDeleteClick = (user: RHUser) => {
        setUserToDelete(user);
        setIsAlertOpen(true);
    }

    const handleResetPasswordClick = (user: RHUser) => {
        setUserToResetPassword(user);
        setNewPassword('');
        setConfirmNewPassword('');
        setIsResetPasswordDialogOpen(true);
    };

    const handleResetPassword = () => {
        if (!userToResetPassword) return;

        // Validações
        if (!newPassword || newPassword.length < 6) {
            toast({
                title: "Erro",
                description: "A nova senha deve ter pelo menos 6 caracteres.",
                variant: "destructive"
            });
            return;
        }

        if (newPassword !== confirmNewPassword) {
            toast({
                title: "Erro",
                description: "As senhas não coincidem.",
                variant: "destructive"
            });
            return;
        }

        resetRHUserPassword.mutate(
            { userId: userToResetPassword.id, newPassword },
            {
                onSuccess: (data) => {
                    setResetPasswordCredentials({
                        email: data.email,
                        password: newPassword,
                        name: userToResetPassword.full_name
                    });
                    setIsResetPasswordResultDialogOpen(true);
                    setIsResetPasswordDialogOpen(false);
                    toast({
                        title: "Sucesso!",
                        description: "Senha resetada com sucesso."
                    });
                },
                onError: (error) => {
                    toast({
                        title: "Erro ao resetar senha",
                        description: error.message,
                        variant: "destructive"
                    });
                }
            }
        );
    };

    const handleConfirmDelete = () => {
        if (!userToDelete) return;
        deleteRHUser.mutate(userToDelete.id, {
            onSuccess: () => {
                toast({ title: "Sucesso!", description: "Membro da equipe removido." });
                refetch();
            },
            onError: (error) => {
                toast({ title: "Erro ao remover membro", description: error.message, variant: "destructive" });
            },
            onSettled: () => {
                setIsAlertOpen(false);
                setUserToDelete(null);
            }
        });
    };

    const handleSaveUser = (user: NewRHUser | RHUser) => {
        console.log('📝 handleSaveUser chamado com:', user);
        console.log('🔄 Estado da mutation createRHUser:', {
            isPending: createRHUser.isPending,
            isError: createRHUser.isError,
            isSuccess: createRHUser.isSuccess,
            error: createRHUser.error
        });

        if ('id' in user && user.id) {
            console.log('✏️ Editando usuário existente:', user.id);
            updateRHUser.mutate(user, {
                onSuccess: () => {
                    console.log('✅ Usuário atualizado com sucesso');
                    toast({ title: "Sucesso!", description: "Membro da equipe atualizado." });
                    refetch();
                    setIsDialogOpen(false);
                    setUserToEdit(null);
                },
                onError: (error) => {
                    console.error('❌ Erro ao atualizar usuário:', error);
                    toast({ title: "Erro ao atualizar membro", description: error.message, variant: "destructive" });
                },
            });
        } else {
            console.log('👤 Criando novo usuário');
            const newUserData = user as NewRHUser & { password?: string };
            console.log('📊 Dados do novo usuário:', newUserData);

            if (createRHUser.isPending) {
                console.warn('⚠️ Mutation já está pendente, ignorando nova tentativa');
                return;
            }

            console.log('🚀 Iniciando mutação createRHUser...');

            createRHUser.mutate(newUserData, {
                onSuccess: (data) => {
                    console.log('✅ Usuário criado com sucesso em handleSaveUser:', data);
                    // Mostrar credenciais criadas
                    if (data.password) {
                        setNewUserCredentials({
                            email: data.email,
                            password: data.password,
                            name: data.full_name
                        });
                        setIsCredentialsDialogOpen(true);
                    }

                    toast({ title: "Sucesso!", description: "Usuário criado e pode fazer login imediatamente!" });
                    refetch();
                    setIsDialogOpen(false);
                },
                onError: (error) => {
                    console.error('❌ Erro em handleSaveUser:', error);
                    console.error('❌ Stack trace:', error.stack);

                    // Mostrar erro detalhado
                    let errorMessage = error.message;
                    if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
                        errorMessage = 'Este email já está cadastrado no sistema.';
                    } else if (error.message.includes('Invalid email')) {
                        errorMessage = 'Email inválido. Verifique o formato do email.';
                    } else if (error.message.includes('Password')) {
                        errorMessage = 'Erro na senha. Verifique se tem pelo menos 6 caracteres.';
                    }

                    toast({
                        title: "Erro ao criar usuário",
                        description: errorMessage,
                        variant: "destructive",
                        duration: 5000
                    });

                    // Não fechar o diálogo para que o usuário possa tentar novamente
                },
            });
        }
    };

    const handleAddUser = (newUser: NewRHUser) => {
        console.log('🚀 Tentando criar usuário:', newUser);

        // Implementar timeout de 30 segundos
        const timeoutId = setTimeout(() => {
            if (createRHUser.isPending) {
                console.log('⏰ Timeout atingido, resetando mutation');
                createRHUser.reset();
                toast({
                    title: "Timeout",
                    description: "A operação demorou muito para responder. Tente novamente.",
                    variant: "destructive"
                });
            }
        }, 30000);

        createRHUser.mutate(newUser, {
            onSuccess: (data) => {
                clearTimeout(timeoutId);
                console.log('✅ Usuário criado com sucesso no componente:', data);
                setNewUserCredentials({
                    email: data.email,
                    password: data.password,
                    name: data.full_name
                });
                setIsCredentialsDialogOpen(true);
                setIsDialogOpen(false);
            },
            onError: (error) => {
                clearTimeout(timeoutId);
                console.error('❌ Erro na criação do usuário no componente:', error);
                toast({
                    title: "Erro ao criar usuário",
                    description: error.message,
                    variant: "destructive"
                });
            }
        });
    };

    if (isLoadingUsers) {
        return <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin" /> Carregando usuários...</div>;
    }

    // Verificar se há usuários com dados incompletos
    const incompleteUsers = rhUsers.filter(user => !user.full_name || !user.email);

    const handleFixIncompleteUser = async (user: RHUser) => {
        // Buscar dados do Auth para corrigir
        toast({
            title: "Corrigindo dados...",
            description: "Buscando informações do sistema de autenticação",
        });

        // Aqui você poderia implementar uma correção automática
        // Por enquanto, apenas mostrar um toast informativo
        toast({
            title: "Ação necessária",
            description: `Edite o usuário para corrigir o nome e email manualmente`,
            variant: "destructive",
        });
    };

    return (
        <>
            {/* Alerta para usuários com dados incompletos */}
            {incompleteUsers.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                        <CardTitle className="text-orange-800 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Atenção: Usuários com dados incompletos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-orange-700 mb-3">
                            {incompleteUsers.length} usuário(s) encontrado(s) com nome ou email em branco.
                            Isso pode ter acontecido devido a um erro durante a criação.
                        </p>
                        <div className="space-y-2">
                            {incompleteUsers.map(user => (
                                <div key={user.id} className="flex items-center justify-between bg-white p-3 rounded border">
                                    <span className="text-sm">
                                        ID: {user.id} | Nome: "{user.full_name || 'VAZIO'}" | Email: "{user.email || 'VAZIO'}"
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditClick(user)}
                                        className="text-orange-600 border-orange-300 hover:bg-orange-100"
                                    >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Corrigir
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center"><Shield className="mr-2" />Gestão da Equipe de RH</CardTitle>
                        <p className="text-sm text-gray-500">Adicione, remova e edite as permissões dos recrutadores.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            disabled={isLoadingUsers}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                            Atualizar
                        </Button>
                        <AddUserDialog
                            onSave={handleSaveUser}
                            userToEdit={userToEdit}
                            isOpen={isDialogOpen}
                            onOpenChange={(open) => {
                                if (!open) {
                                    // Reset mutation state when closing
                                    createRHUser.reset();
                                    setUserToEdit(null);
                                }
                                setIsDialogOpen(open);
                            }}
                            isLoading={createRHUser.isPending}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Nível de Acesso</TableHead>
                                <TableHead>Regiões</TableHead>
                                <TableHead>Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rhUsers.map((rhUser) => {
                                const isSelf = currentUser?.id === rhUser.user_id;
                                return (
                                    <TableRow key={rhUser.id}>
                                        <TableCell className="font-medium">
                                            {rhUser.full_name || (
                                                <span className="text-red-500 italic">Nome não informado</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {rhUser.email || (
                                                <span className="text-red-500 italic">Email não informado</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={rhUser.is_admin ? "default" : "secondary"}>
                                                {rhUser.is_admin ? "Admin" : "Recrutador"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {rhUser.is_admin ? (
                                                <span className="text-blue-600 font-medium">Acesso total</span>
                                            ) : (
                                                <div className="space-y-1">
                                                    {rhUser.assigned_states && rhUser.assigned_states.length > 0 && (
                                                        <div>
                                                            <span className="font-medium">Estados:</span> {rhUser.assigned_states.join(", ")}
                                                        </div>
                                                    )}
                                                    {rhUser.assigned_cities && rhUser.assigned_cities.length > 0 && (
                                                        <div>
                                                            <span className="font-medium">Cidades:</span> {rhUser.assigned_cities.join(", ")}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(rhUser)} disabled={isSelf}>
                                                    <Edit className={`h-4 w-4 ${isSelf ? 'text-gray-400' : ''}`} />
                                                </Button>
                                                {rhUser.user_id && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleResetPasswordClick(rhUser)}
                                                        title="Resetar Senha"
                                                        disabled={isSelf}
                                                    >
                                                        <Key className={`h-4 w-4 ${isSelf ? 'text-gray-400' : 'text-blue-600'}`} />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(rhUser)} disabled={isSelf}>
                                                    <Trash2 className={`h-4 w-4 ${isSelf ? 'text-gray-400' : ''}`} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Diálogo de confirmação de exclusão */}
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso removerá permanentemente o acesso do usuário
                            <span className="font-bold"> {userToDelete?.full_name}</span> e todos os seus dados associados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} disabled={deleteRHUser.isPending}>
                            {deleteRHUser.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                            Continuar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Diálogo com credenciais do novo usuário */}
            <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-green-600" />
                            Usuário Criado com Sucesso!
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-semibold text-green-800 mb-2">Credenciais de Acesso</h4>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="font-medium">Nome:</span> {newUserCredentials?.name}
                                </div>
                                <div>
                                    <span className="font-medium">Email:</span> {newUserCredentials?.email}
                                </div>
                                <div>
                                    <span className="font-medium">Senha:</span> {newUserCredentials?.password}
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-800 mb-2">Instruções para o Usuário</h4>
                            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                                <li>O usuário pode fazer login diretamente no portal administrativo</li>
                                <li>Acesse: <strong>http://localhost:8082/admin</strong></li>
                                <li>Use as credenciais mostradas acima</li>
                                <li>Recomendamos que ele altere a senha no primeiro acesso</li>
                            </ol>
                            <div className="mt-3">
                                <Button
                                    onClick={() => window.open('/admin', '_blank')}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    Abrir Portal de Login
                                </Button>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-semibold text-green-800 mb-2">✅ Conta Criada com Sucesso</h4>
                            <p className="text-sm text-green-700">
                                O usuário foi criado diretamente no sistema de autenticação e pode fazer login imediatamente. Não é necessário registro adicional.
                            </p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-semibold text-yellow-800 mb-2">🔒 Segurança</h4>
                            <p className="text-sm text-yellow-700">
                                Esta é a única vez que a senha será exibida. Certifique-se de enviá-la ao usuário de forma segura.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => {
                            setIsCredentialsDialogOpen(false);
                            setNewUserCredentials(null);
                        }}>
                            Entendi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diálogo de Reset de Senha */}
            <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Key className="w-5 h-5 text-blue-600" />
                            Resetar Senha
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-800 mb-2">Usuário Selecionado</h4>
                            <div className="space-y-1 text-sm">
                                <div><span className="font-medium">Nome:</span> {userToResetPassword?.full_name}</div>
                                <div><span className="font-medium">Email:</span> {userToResetPassword?.email}</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nova Senha</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    disabled={resetRHUserPassword.isPending}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmNewPassword">Confirmar Nova Senha</Label>
                                <Input
                                    id="confirmNewPassword"
                                    type="password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    placeholder="Digite a senha novamente"
                                    disabled={resetRHUserPassword.isPending}
                                />
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Atenção</h4>
                            <p className="text-sm text-yellow-700">
                                Esta ação irá alterar a senha do usuário. Certifique-se de informar a nova senha ao usuário de forma segura.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsResetPasswordDialogOpen(false)}
                            disabled={resetRHUserPassword.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleResetPassword}
                            disabled={resetRHUserPassword.isPending}
                        >
                            {resetRHUserPassword.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetando...
                                </>
                            ) : (
                                "Resetar Senha"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diálogo com resultado do reset de senha */}
            <Dialog open={isResetPasswordResultDialogOpen} onOpenChange={setIsResetPasswordResultDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Key className="w-5 h-5 text-green-600" />
                            Senha Resetada com Sucesso!
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-semibold text-green-800 mb-2">Novas Credenciais</h4>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="font-medium">Nome:</span> {resetPasswordCredentials?.name}
                                </div>
                                <div>
                                    <span className="font-medium">Email:</span> {resetPasswordCredentials?.email}
                                </div>
                                <div>
                                    <span className="font-medium">Nova Senha:</span> {resetPasswordCredentials?.password}
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-800 mb-2">Próximos Passos</h4>
                            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                                <li>Informe as novas credenciais ao usuário de forma segura</li>
                                <li>O usuário pode fazer login imediatamente com a nova senha</li>
                                <li>Recomende que o usuário altere a senha no primeiro acesso</li>
                            </ol>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-semibold text-yellow-800 mb-2">🔒 Segurança</h4>
                            <p className="text-sm text-yellow-700">
                                Esta é a única vez que a nova senha será exibida. Certifique-se de copiá-la antes de fechar esta janela.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => {
                            setIsResetPasswordResultDialogOpen(false);
                            setResetPasswordCredentials(null);
                            setUserToResetPassword(null);
                        }}>
                            Entendi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default RHManagement; 