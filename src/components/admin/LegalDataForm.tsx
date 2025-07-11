import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, AlertCircle, Shield } from 'lucide-react';
import { validateCPF, formatCPF, formatRG, validateBirthDate, validateFullName } from '@/utils/legal-validation';
import { WorkHistory, LegalDataFormValues } from '@/types/legal-validation';
import { states, cities } from '@/data/cities-states';

interface LegalDataFormProps {
    candidateId: string;
    candidateName: string;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: LegalDataFormValues) => Promise<void>;
    initialData?: LegalDataFormValues;
}

export const LegalDataForm = ({
    candidateId,
    candidateName,
    isOpen,
    onClose,
    onSubmit,
    initialData
}: LegalDataFormProps) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedState, setSelectedState] = useState('');
    const [availableCities, setAvailableCities] = useState<string[]>([]);

    const [formData, setFormData] = useState<LegalDataFormValues>({
        full_name: '',
        birth_date: '',
        rg: '',
        cpf: '',
        mother_name: '',
        father_name: '',
        birth_city: '',
        birth_state: '',
        work_history: [],
        is_former_employee: false,
        former_employee_details: '',
        is_pcd: false,
        pcd_details: '',
        desired_position: '',
        responsible_name: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setSelectedState(initialData.birth_state);
        }
    }, [initialData]);

    useEffect(() => {
        if (selectedState) {
            setAvailableCities(cities[selectedState] || []);
        }
    }, [selectedState]);

    const handleInputChange = (field: keyof LegalDataFormValues, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Limpar erro do campo quando o usuário digitar
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleCPFChange = (value: string) => {
        const formatted = formatCPF(value);
        handleInputChange('cpf', formatted);
    };

    const handleRGChange = (value: string) => {
        const formatted = formatRG(value);
        handleInputChange('rg', formatted);
    };

    const addWorkHistory = () => {
        const newWork: WorkHistory = {
            company: '',
            position: '',
            start_date: '',
            end_date: '',
            is_current: false
        };
        setFormData(prev => ({
            ...prev,
            work_history: [...prev.work_history, newWork]
        }));
    };

    const updateWorkHistory = (index: number, field: keyof WorkHistory, value: any) => {
        const updatedHistory = [...formData.work_history];
        updatedHistory[index] = { ...updatedHistory[index], [field]: value };
        setFormData(prev => ({ ...prev, work_history: updatedHistory }));
    };

    const removeWorkHistory = (index: number) => {
        setFormData(prev => ({
            ...prev,
            work_history: prev.work_history.filter((_, i) => i !== index)
        }));
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validações obrigatórias
        if (!formData.full_name || !validateFullName(formData.full_name)) {
            newErrors.full_name = 'Nome completo deve ter pelo menos 2 palavras';
        }

        if (!formData.birth_date) {
            newErrors.birth_date = 'Data de nascimento é obrigatória';
        } else if (!validateBirthDate(formData.birth_date)) {
            newErrors.birth_date = 'Candidato deve ser maior de 18 anos';
        }

        if (!formData.cpf) {
            newErrors.cpf = 'CPF é obrigatório';
        } else if (!validateCPF(formData.cpf)) {
            newErrors.cpf = 'CPF inválido';
        }

        if (!formData.rg) {
            newErrors.rg = 'RG é obrigatório';
        }

        if (!formData.mother_name || !validateFullName(formData.mother_name)) {
            newErrors.mother_name = 'Nome da mãe deve ter pelo menos 2 palavras';
        }

        if (!formData.birth_city) {
            newErrors.birth_city = 'Cidade de nascimento é obrigatória';
        }

        if (!formData.birth_state) {
            newErrors.birth_state = 'Estado de nascimento é obrigatório';
        }

        if (!formData.desired_position) {
            newErrors.desired_position = 'Função pretendida é obrigatória';
        }

        // Validar histórico profissional
        formData.work_history.forEach((work, index) => {
            if (!work.company) {
                newErrors[`work_${index}_company`] = 'Empresa é obrigatória';
            }
            if (!work.position) {
                newErrors[`work_${index}_position`] = 'Cargo é obrigatório';
            }
            if (!work.start_date) {
                newErrors[`work_${index}_start_date`] = 'Data de início é obrigatória';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            toast({
                title: "Erro de validação",
                description: "Por favor, corrija os campos destacados",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            await onSubmit(formData);
            toast({
                title: "Dados salvos com sucesso",
                description: "As informações foram registradas para validação jurídica"
            });
            onClose();
        } catch (error) {
            toast({
                title: "Erro ao salvar",
                description: "Ocorreu um erro ao salvar os dados. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        Dados para Validação Jurídica
                    </DialogTitle>
                    <DialogDescription>
                        Preencha os dados do candidato <strong>{candidateName}</strong> para análise jurídica.
                        Todos os campos marcados com * são obrigatórios.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Aviso LGPD */}
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <strong>Aviso de Privacidade:</strong> Os dados coletados serão utilizados exclusivamente
                                para validação jurídica e cumprimento de requisitos legais de contratação, em conformidade com a LGPD.
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dados Pessoais */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Dados Pessoais</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="full_name">Nome Completo *</Label>
                                <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                                    className={errors.full_name ? 'border-red-500' : ''}
                                />
                                {errors.full_name && <p className="text-sm text-red-500 mt-1">{errors.full_name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="birth_date">Data de Nascimento *</Label>
                                <Input
                                    id="birth_date"
                                    type="date"
                                    value={formData.birth_date}
                                    onChange={(e) => handleInputChange('birth_date', e.target.value)}
                                    className={errors.birth_date ? 'border-red-500' : ''}
                                />
                                {errors.birth_date && <p className="text-sm text-red-500 mt-1">{errors.birth_date}</p>}
                            </div>

                            <div>
                                <Label htmlFor="cpf">CPF *</Label>
                                <Input
                                    id="cpf"
                                    value={formData.cpf}
                                    onChange={(e) => handleCPFChange(e.target.value)}
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                    className={errors.cpf ? 'border-red-500' : ''}
                                />
                                {errors.cpf && <p className="text-sm text-red-500 mt-1">{errors.cpf}</p>}
                            </div>

                            <div>
                                <Label htmlFor="rg">RG *</Label>
                                <Input
                                    id="rg"
                                    value={formData.rg}
                                    onChange={(e) => handleRGChange(e.target.value)}
                                    className={errors.rg ? 'border-red-500' : ''}
                                />
                                {errors.rg && <p className="text-sm text-red-500 mt-1">{errors.rg}</p>}
                            </div>

                            <div>
                                <Label htmlFor="mother_name">Nome da Mãe *</Label>
                                <Input
                                    id="mother_name"
                                    value={formData.mother_name}
                                    onChange={(e) => handleInputChange('mother_name', e.target.value)}
                                    className={errors.mother_name ? 'border-red-500' : ''}
                                />
                                {errors.mother_name && <p className="text-sm text-red-500 mt-1">{errors.mother_name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="father_name">Nome do Pai</Label>
                                <Input
                                    id="father_name"
                                    value={formData.father_name || ''}
                                    onChange={(e) => handleInputChange('father_name', e.target.value)}
                                    placeholder="Opcional"
                                />
                            </div>

                            <div>
                                <Label htmlFor="birth_state">Estado de Nascimento *</Label>
                                <select
                                    id="birth_state"
                                    value={formData.birth_state}
                                    onChange={(e) => {
                                        handleInputChange('birth_state', e.target.value);
                                        setSelectedState(e.target.value);
                                        handleInputChange('birth_city', '');
                                    }}
                                    className={`w-full rounded-md border ${errors.birth_state ? 'border-red-500' : 'border-gray-300'} px-3 py-2`}
                                >
                                    <option value="">Selecione o estado</option>
                                    {Object.keys(states).map(uf => (
                                        <option key={uf} value={uf}>{states[uf]}</option>
                                    ))}
                                </select>
                                {errors.birth_state && <p className="text-sm text-red-500 mt-1">{errors.birth_state}</p>}
                            </div>

                            <div>
                                <Label htmlFor="birth_city">Cidade de Nascimento *</Label>
                                <select
                                    id="birth_city"
                                    value={formData.birth_city}
                                    onChange={(e) => handleInputChange('birth_city', e.target.value)}
                                    disabled={!selectedState}
                                    className={`w-full rounded-md border ${errors.birth_city ? 'border-red-500' : 'border-gray-300'} px-3 py-2`}
                                >
                                    <option value="">Selecione a cidade</option>
                                    {availableCities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                                {errors.birth_city && <p className="text-sm text-red-500 mt-1">{errors.birth_city}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Histórico Profissional */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">Histórico Profissional</h3>
                            <Button type="button" variant="outline" size="sm" onClick={addWorkHistory}>
                                <Plus className="w-4 h-4 mr-1" />
                                Adicionar Experiência
                            </Button>
                        </div>

                        {formData.work_history.map((work, index) => (
                            <Card key={index}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-medium">Experiência {index + 1}</h4>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeWorkHistory(index)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Empresa *</Label>
                                            <Input
                                                value={work.company}
                                                onChange={(e) => updateWorkHistory(index, 'company', e.target.value)}
                                                className={errors[`work_${index}_company`] ? 'border-red-500' : ''}
                                            />
                                            {errors[`work_${index}_company`] &&
                                                <p className="text-sm text-red-500 mt-1">{errors[`work_${index}_company`]}</p>
                                            }
                                        </div>

                                        <div>
                                            <Label>Cargo *</Label>
                                            <Input
                                                value={work.position}
                                                onChange={(e) => updateWorkHistory(index, 'position', e.target.value)}
                                                className={errors[`work_${index}_position`] ? 'border-red-500' : ''}
                                            />
                                            {errors[`work_${index}_position`] &&
                                                <p className="text-sm text-red-500 mt-1">{errors[`work_${index}_position`]}</p>
                                            }
                                        </div>

                                        <div>
                                            <Label>Data de Início *</Label>
                                            <Input
                                                type="date"
                                                value={work.start_date}
                                                onChange={(e) => updateWorkHistory(index, 'start_date', e.target.value)}
                                                className={errors[`work_${index}_start_date`] ? 'border-red-500' : ''}
                                            />
                                            {errors[`work_${index}_start_date`] &&
                                                <p className="text-sm text-red-500 mt-1">{errors[`work_${index}_start_date`]}</p>
                                            }
                                        </div>

                                        <div>
                                            <Label>Data de Término</Label>
                                            <Input
                                                type="date"
                                                value={work.end_date || ''}
                                                onChange={(e) => updateWorkHistory(index, 'end_date', e.target.value)}
                                                disabled={work.is_current}
                                            />
                                            <div className="flex items-center gap-2 mt-2">
                                                <Switch
                                                    id={`current-${index}`}
                                                    checked={work.is_current}
                                                    onCheckedChange={(checked) => {
                                                        updateWorkHistory(index, 'is_current', checked);
                                                        if (checked) {
                                                            updateWorkHistory(index, 'end_date', '');
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={`current-${index}`} className="text-sm">
                                                    Trabalho atual
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Informações Adicionais */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Informações Adicionais</h3>

                        <div>
                            <Label htmlFor="desired_position">Função Pretendida *</Label>
                            <Input
                                id="desired_position"
                                value={formData.desired_position}
                                onChange={(e) => handleInputChange('desired_position', e.target.value)}
                                className={errors.desired_position ? 'border-red-500' : ''}
                            />
                            {errors.desired_position && <p className="text-sm text-red-500 mt-1">{errors.desired_position}</p>}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="former_employee"
                                        checked={formData.is_former_employee}
                                        onCheckedChange={(checked) => handleInputChange('is_former_employee', checked)}
                                    />
                                    <Label htmlFor="former_employee">Ex-colaborador?</Label>
                                </div>
                                {formData.is_former_employee && (
                                    <Textarea
                                        className="mt-2"
                                        placeholder="Detalhes sobre o período anterior (cargo, período, motivo da saída, etc.)"
                                        value={formData.former_employee_details || ''}
                                        onChange={(e) => handleInputChange('former_employee_details', e.target.value)}
                                    />
                                )}
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="pcd"
                                        checked={formData.is_pcd}
                                        onCheckedChange={(checked) => handleInputChange('is_pcd', checked)}
                                    />
                                    <Label htmlFor="pcd">Candidato para vaga PCD?</Label>
                                </div>
                                {formData.is_pcd && (
                                    <Textarea
                                        className="mt-2"
                                        placeholder="Tipo de deficiência e necessidades especiais"
                                        value={formData.pcd_details || ''}
                                        onChange={(e) => handleInputChange('pcd_details', e.target.value)}
                                    />
                                )}
                            </div>

                            <div>
                                <Label htmlFor="responsible_name">Responsável (se aplicável)</Label>
                                <Input
                                    id="responsible_name"
                                    value={formData.responsible_name || ''}
                                    onChange={(e) => handleInputChange('responsible_name', e.target.value)}
                                    placeholder="Nome do responsável legal (se menor de idade ou necessário)"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Botões de ação */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar Dados'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}; 