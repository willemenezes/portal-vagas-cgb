import { useState } from 'react';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Candidate } from "@/hooks/useCandidates";
import { useCandidateNotes, useCreateCandidateNote, useCandidateHistory, HistoryItem } from '@/hooks/useCandidateNotes';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Phone, MapPin, Loader2, MessageSquare, Briefcase, Activity, Send, Info, List, X, ExternalLink, Download, MessageCircle, FileClock, Gavel, CheckCircle, XCircle, AlertTriangle, Shield, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LegalDataForm } from './LegalDataForm';
import { useLegalData, useSaveLegalData } from '@/hooks/useLegalData';
import { useRHProfile } from '@/hooks/useRH';
import { Card, CardContent } from '@/components/ui/card';
import { maskCPF, maskRG } from '@/utils/legal-validation';

// Props do componente
interface CandidateDetailModalProps {
    candidate: Candidate | null;
    isOpen: boolean;
    onClose: () => void;
}

// --- SUB-COMPONENTES PARA ORGANIZAÇÃO ---

// Cabeçalho do Modal
const ModalHeader = ({ candidate, onClose }: { candidate: Candidate, onClose: () => void }) => (
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border">
                <AvatarImage src={candidate.avatar_url || ''} />
                <AvatarFallback className="bg-cgb-primary-dark text-white text-xl">{candidate.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">{candidate.name}</h2>
                <p className="text-gray-500">Aplicado para a vaga de: <span className="font-semibold text-cgb-primary">{candidate.job?.title || "Não especificado"}</span></p>
                <div className="mt-2 flex gap-2">
                    <Badge variant="secondary">{candidate.status}</Badge>
                    <Badge variant="outline">{candidate.city}, {candidate.state}</Badge>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
                <a href={candidate.resume_file_url || '#'} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" /> Ver Currículo
                </a>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
            </Button>
        </div>
    </div>
);

// Barra Lateral de Navegação
const LeftNav = ({ activeView, setActiveView }: { activeView: string, setActiveView: (view: string) => void }) => {
    const navItems = [
        { id: 'details', label: 'Detalhes', icon: Info },
        { id: 'history', label: 'Histórico', icon: FileClock },
        { id: 'communication', label: 'Comunicação', icon: Send },
    ];
    return (
        <div className="w-64 bg-gray-50 p-6 border-r border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Navegação</h3>
            <div className="space-y-2">
                {navItems.map(item => (
                    <Button
                        key={item.id}
                        variant={activeView === item.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start gap-3"
                        onClick={() => setActiveView(item.id)}
                    >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                    </Button>
                ))}
            </div>
        </div>
    );
};

// Seção de Comunicação
const CommunicationView = ({ candidate }: { candidate: Candidate }) => {
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [whatsappBody, setWhatsappBody] = useState("");
    const [communicationChannel, setCommunicationChannel] = useState<'email' | 'whatsapp'>('email');
    const createNote = useCreateCandidateNote();
    const { user } = useAuth();
    const { toast } = useToast();

    const EMAIL_TEMPLATES = [
        { id: 'interview', name: 'Convite para Entrevista', subject: 'Convite para Entrevista no Grupo CGB - Vaga de {{vaga}}', body: 'Olá, {{candidato}}!\n\nRecebemos sua aplicação para a vaga de {{vaga}} e ficamos muito interessados no seu perfil.\n\nGostaríamos de convidá-lo(a) para uma entrevista para nos conhecermos melhor.\n\nAtenciosamente,\nEquipe de Recrutamento Grupo CGB' },
        { id: 'rejection', name: 'Feedback Negativo', subject: 'Retorno sobre o processo seletivo para {{vaga}}', body: 'Olá, {{candidato}}.\n\nAgradecemos seu interesse na vaga de {{vaga}}.\n\nNeste momento, optamos por seguir com outros candidatos.\n\nAtenciosamente,\nEquipe de Recrutamento Grupo CGB' },
        { id: 'info', name: 'Informação Geral', subject: 'Contato do Grupo CGB sobre sua candidatura', body: 'Olá, {{candidato}}.\n\nEntramos em contato para falar sobre o seu processo seletivo para a vaga de {{vaga}}.\n\n[Insira aqui a sua mensagem]\n\nAtenciosamente,\nEquipe de Recrutamento Grupo CGB' },
    ];

    const handleTemplateChange = (templateId: string) => {
        const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
        if (template && candidate) {
            setSelectedTemplate(templateId);
            const candidateName = candidate.name.split(' ')[0];
            const jobTitle = candidate.job?.title || 'Não especificado';

            setEmailSubject(template.subject.replace('{{vaga}}', jobTitle));
            const emailContent = template.body.replace(/{{candidato}}/g, candidate.name).replace(/{{vaga}}/g, jobTitle);
            setEmailBody(emailContent);
            setWhatsappBody(emailContent.replace(`Olá, ${candidate.name}`, `Olá, ${candidateName}`));
        }
    };

    const handleSendEmail = async () => {
        if (!candidate || !emailSubject || !emailBody) return;
        setIsSendingEmail(true);
        try {
            const { error } = await supabase.functions.invoke('send-email', {
                body: { to: candidate.email, subject: emailSubject, html: emailBody.replace(/\\n/g, '<br>') },
            });
            if (error) throw new Error(error.message);
            toast({ title: "E-mail enviado com sucesso!", description: `E-mail enviado para ${candidate.name}.` });
            if (user) createNote.mutate({ candidate_id: candidate.id, author_id: user.id, note: `E-mail enviado: "${emailSubject}"`, activity_type: 'Comunicação' });
        } catch (error: any) {
            toast({ title: "Erro ao enviar e-mail", description: error.message, variant: "destructive" });
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleSendWhatsApp = () => {
        if (!candidate || !whatsappBody) return;
        const phoneNumber = candidate.phone?.replace(/\D/g, '');
        if (!phoneNumber) {
            toast({ title: "Erro", description: "O candidato não possui um número de telefone válido.", variant: "destructive" });
            return;
        }
        const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(whatsappBody)}`;
        window.open(whatsappUrl, '_blank');
        if (user) createNote.mutate({ candidate_id: candidate.id, author_id: user.id, note: `Contato via WhatsApp iniciado.`, activity_type: 'Comunicação' });
    };

    return (
        <div className="p-8 space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Enviar Comunicação</h2>
            <div className="flex justify-center p-1 bg-gray-100 rounded-lg">
                <Button onClick={() => setCommunicationChannel('email')} variant={communicationChannel === 'email' ? 'primary' : 'ghost'} className="w-full"><Mail className="w-4 h-4 mr-2" /> E-mail</Button>
                <Button onClick={() => setCommunicationChannel('whatsapp')} variant={communicationChannel === 'whatsapp' ? 'primary' : 'ghost'} className="w-full"><MessageCircle className="w-4 h-4 mr-2" /> WhatsApp</Button>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Template de Mensagem</label>
                <Select onValueChange={handleTemplateChange}><SelectTrigger><SelectValue placeholder="Selecione um template..." /></SelectTrigger><SelectContent>{EMAIL_TEMPLATES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
            </div>
            {communicationChannel === 'email' ? (
                <>
                    <div className="space-y-2"><label htmlFor="email-subject" className="text-sm font-medium">Assunto</label><Input id="email-subject" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} /></div>
                    <div className="space-y-2"><label htmlFor="email-body" className="text-sm font-medium">Corpo do E-mail</label><Textarea id="email-body" value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={8} /></div>
                    <Button onClick={handleSendEmail} disabled={isSendingEmail}>{isSendingEmail ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />} Enviar E-mail</Button>
                </>
            ) : (
                <>
                    <div className="space-y-2"><label htmlFor="whatsapp-body" className="text-sm font-medium">Mensagem</label><Textarea id="whatsapp-body" value={whatsappBody} onChange={e => setWhatsappBody(e.target.value)} rows={8} /></div>
                    <Button onClick={handleSendWhatsApp}><MessageCircle className="mr-2 h-4 w-4" /> Enviar via WhatsApp</Button>
                </>
            )}
        </div>
    );
};

// Seção de Histórico
const HistoryView = ({ candidate }: { candidate: Candidate }) => {
    const { data: history = [], isLoading: isLoadingHistory } = useCandidateHistory(candidate?.id || null);

    const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'S';

    const getHistoryIcon = (item: HistoryItem) => {
        if (item.type === 'legal_validation') {
            switch (item.legal_status) {
                case 'aprovado':
                    return { Icon: CheckCircle, color: 'bg-green-100 text-green-600' };
                case 'reprovado':
                    return { Icon: XCircle, color: 'bg-red-100 text-red-600' };
                case 'aprovado_com_restricao':
                    return { Icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-600' };
                default:
                    return { Icon: Gavel, color: 'bg-purple-100 text-purple-600' };
            }
        }

        // Ícones para notas regulares
        switch (item.activity_type) {
            case 'Mudança de Status':
                return { Icon: Activity, color: 'bg-blue-100 text-blue-600' };
            case 'Comunicação':
                return { Icon: Send, color: 'bg-green-100 text-green-600' };
            default:
                return { Icon: MessageSquare, color: 'bg-gray-100 text-gray-600' };
        }
    };

    const getStatusBadge = (item: HistoryItem) => {
        if (item.type !== 'legal_validation' || !item.legal_status) return null;

        const statusConfig = {
            aprovado: { label: 'Aprovado', className: 'bg-green-100 text-green-800 border-green-200' },
            reprovado: { label: 'Reprovado', className: 'bg-red-100 text-red-800 border-red-200' },
            aprovado_com_restricao: { label: 'Aprovado c/ Restrição', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
        };

        const config = statusConfig[item.legal_status];
        if (!config) return null;

        return (
            <Badge variant="outline" className={`${config.className} text-xs font-medium`}>
                {config.label}
            </Badge>
        );
    };

    if (isLoadingHistory) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    if (history.length === 0) {
        return (
            <div className="p-8 space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Histórico do Candidato</h2>
                <div className="text-center py-12">
                    <FileClock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Nenhum histórico disponível para este candidato.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Histórico do Candidato</h2>
            <div className="relative border-l-2 border-gray-200 ml-4">
                {history.map((item) => {
                    const { Icon, color } = getHistoryIcon(item);

                    return (
                        <div key={item.id} className="mb-8 ml-8">
                            <span className={`absolute -left-[1.35rem] flex items-center justify-center w-10 h-10 ${color} rounded-full ring-8 ring-white`}>
                                <Icon className="w-5 h-5" />
                            </span>
                            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-gray-900">
                                            {item.author?.full_name || 'Sistema'}
                                        </span>
                                        {getStatusBadge(item)}
                                    </div>
                                    <time className="text-xs font-normal text-gray-500">
                                        {format(new Date(item.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                                    </time>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-xs">
                                            {item.activity_type}
                                        </Badge>
                                    </div>
                                    <p className="text-gray-700">{item.content}</p>
                                    {item.type === 'legal_validation' && item.comments && (
                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                                            <p className="text-sm text-gray-600 font-medium">Observações do Jurídico:</p>
                                            <p className="text-sm text-gray-700 mt-1">{item.comments}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Componente para a visão de "Detalhes"
const DetailsView = ({ candidate }: { candidate: Candidate }) => {
    const { user } = useAuth();
    const { data: rhProfile } = useRHProfile(user?.id);
    const { data: legalData, isLoading: isLoadingLegal } = useLegalData(candidate.id);
    const saveLegalData = useSaveLegalData();
    const [showLegalForm, setShowLegalForm] = useState(false);
    const { toast } = useToast();

    const canCollectLegalData = candidate.status === 'Validação TJ' &&
        rhProfile &&
        ['admin', 'recruiter', 'manager'].includes(rhProfile.role);

    const canViewLegalData = legalData &&
        rhProfile &&
        ['admin', 'recruiter', 'manager', 'juridico'].includes(rhProfile.role);

    const handleSaveLegalData = async (data: any) => {
        await saveLegalData.mutateAsync({ candidateId: candidate.id, data });
        setShowLegalForm(false);
    };

    const getLegalStatusBadge = () => {
        if (!legalData) return null;

        const statusConfig = {
            pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
            approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
            rejected: { label: 'Reprovado', color: 'bg-red-100 text-red-800' },
            request_changes: { label: 'Correções Solicitadas', color: 'bg-orange-100 text-orange-800' }
        };

        const config = statusConfig[legalData.review_status || 'pending'];
        return <Badge className={`${config.color} border-0`}>{config.label}</Badge>;
    };

    return (
        <div className="p-8 space-y-8">
            <div>
                <h3 className="text-lg font-semibold text-gray-700">Informações de Contato</h3>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                    <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-gray-400" /> <span>{candidate.email}</span></div>
                    <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-gray-400" /> <span>{candidate.phone}</span></div>
                    <div className="flex items-center gap-3 col-span-full"><MapPin className="w-5 h-5 text-gray-400" /> <span>{`${candidate.city}, ${candidate.state}`}</span></div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-700">Informações da Vaga</h3>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                    <div className="flex items-center gap-3"><Briefcase className="w-5 h-5 text-gray-400" /> <span>{candidate.job?.title}</span></div>
                    <div className="flex items-center gap-3"><Activity className="w-5 h-5 text-gray-400" /> <span>Status: {candidate.status}</span></div>
                </div>
            </div>

            {/* Seção de Validação Jurídica */}
            {(canCollectLegalData || canViewLegalData) && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            Validação Jurídica
                        </h3>
                        {legalData && getLegalStatusBadge()}
                    </div>

                    {isLoadingLegal ? (
                        <Card>
                            <CardContent className="p-6 flex items-center justify-center">
                                <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
                            </CardContent>
                        </Card>
                    ) : legalData ? (
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">CPF</p>
                                        <p className="font-medium">{maskCPF(legalData.cpf)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">RG</p>
                                        <p className="font-medium">{maskRG(legalData.rg)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Data de Nascimento</p>
                                        <p className="font-medium">
                                            {format(new Date(legalData.birth_date), 'dd/MM/yyyy')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Naturalidade</p>
                                        <p className="font-medium">{legalData.birth_city}/{legalData.birth_state}</p>
                                    </div>
                                </div>

                                {legalData.review_notes && (
                                    <div className="pt-4 border-t">
                                        <p className="text-sm text-gray-500 mb-1">Observações da Revisão</p>
                                        <p className="text-sm text-gray-700">{legalData.review_notes}</p>
                                    </div>
                                )}

                                {canCollectLegalData && (
                                    <div className="pt-4 border-t">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowLegalForm(true)}
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            Editar Dados
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : canCollectLegalData ? (
                        <Card className="border-dashed">
                            <CardContent className="p-6 text-center">
                                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600 mb-4">
                                    Dados jurídicos ainda não coletados para este candidato.
                                </p>
                                <Button onClick={() => setShowLegalForm(true)}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Coletar Dados Jurídicos
                                </Button>
                            </CardContent>
                        </Card>
                    ) : null}
                </div>
            )}

            {/* Modal do Formulário de Dados Jurídicos */}
            {showLegalForm && (
                <LegalDataForm
                    candidateId={candidate.id}
                    candidateName={candidate.name}
                    isOpen={showLegalForm}
                    onClose={() => setShowLegalForm(false)}
                    onSubmit={handleSaveLegalData}
                    initialData={legalData}
                />
            )}
        </div>
    );
};

// Conteúdo Principal que renderiza a view correta
const MainContent = ({ view, candidate }: { view: string, candidate: Candidate }) => {
    switch (view) {
        case 'details':
            return <DetailsView candidate={candidate} />;
        case 'history':
            return <HistoryView candidate={candidate} />;
        case 'communication':
            return <CommunicationView candidate={candidate} />;
        default:
            return <div className="p-8"><p>Seção não encontrada.</p></div>;
    }
};

// Barra Lateral de Atividades
const ActivitySidebar = ({ candidate }: { candidate: Candidate }) => {
    const { user } = useAuth();
    const { data: notes = [], isLoading: isLoadingNotes } = useCandidateNotes(candidate?.id || null);
    const createNote = useCreateCandidateNote();
    const [newNote, setNewNote] = useState("");

    const handleAddNote = () => {
        if (!newNote.trim() || !candidate?.id || !user?.id) return;
        createNote.mutate({
            candidate_id: candidate.id,
            author_id: user.id,
            note: newNote,
            activity_type: 'Nota adicionada',
        }, { onSuccess: () => setNewNote("") });
    };

    return (
        <div className="w-96 bg-gray-50 p-6 border-l border-gray-200 flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Notas e Atividades</h3>
            <div className="flex-grow overflow-y-auto -mr-6 pr-6 space-y-4">
                {isLoadingNotes ? <Loader2 className="animate-spin" /> : notes.map(note => (
                    <div key={note.id} className="text-sm">
                        <p className="p-3 bg-white border rounded-lg">{note.note}</p>
                        <div className="text-xs text-gray-500 mt-1">
                            <span>{note.author?.full_name || 'Sistema'}</span> • <span>{format(new Date(note.created_at), 'dd/MM/yy HH:mm')}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t">
                <Textarea placeholder="Adicionar uma nota..." value={newNote} onChange={(e) => setNewNote(e.target.value)} />
                <Button onClick={handleAddNote} disabled={createNote.isPending || !newNote.trim()} className="w-full mt-2">
                    {createNote.isPending ? <Loader2 className="animate-spin mr-2" /> : <MessageSquare className="mr-2 h-4 w-4" />} Adicionar Nota
                </Button>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---

const CandidateDetailModal = ({ candidate, isOpen, onClose }: CandidateDetailModalProps) => {
    const [activeView, setActiveView] = useState('details');

    if (!candidate) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0 flex flex-col">
                <TooltipProvider>
                    <ModalHeader candidate={candidate} onClose={onClose} />
                    <div className="flex-grow flex overflow-hidden">
                        <LeftNav activeView={activeView} setActiveView={setActiveView} />
                        <main className="flex-grow overflow-y-auto bg-white">
                            <MainContent view={activeView} candidate={candidate} />
                        </main>
                        <ActivitySidebar candidate={candidate} />
                    </div>
                </TooltipProvider>
            </DialogContent>
        </Dialog>
    );
};

export default CandidateDetailModal; 