import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Candidate } from "@/hooks/useCandidates";
import { useCandidateNotes, useCreateCandidateNote } from '@/hooks/useCandidateNotes';
import { useAuth } from '@/hooks/useAuth';
import { User, Mail, Phone, MapPin, Loader2, MessageSquare, Briefcase, Activity, Send, Paperclip, Info, List, MessageCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';


interface CandidateDetailModalProps {
    candidate: Candidate | null;
    isOpen: boolean;
    onClose: () => void;
}

// Função para gerar as iniciais do nome
const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.slice(0, 2).toUpperCase();
};

// Função para gerar uma cor com base no nome
const generateColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 70%, 80%)`;
    const textColor = `hsl(${hash % 360}, 70%, 30%)`;
    return { backgroundColor: color, color: textColor };
};


const TimelineItem = ({ note }: { note: any }) => {
    const isStatusChange = note.activity_type === 'Mudança de Status';
    const isCommunication = note.activity_type === 'Comunicação';
    const isManualNote = !isStatusChange && !isCommunication;

    const authorName = note.author?.full_name || note.author?.email || 'Sistema';
    const authorInitials = getInitials(authorName);
    const avatarColors = generateColor(authorName);

    let Icon = MessageSquare;
    let iconColor = 'bg-gray-400';
    if (isStatusChange) {
        Icon = Activity;
        iconColor = 'bg-blue-500';
    } else if (isCommunication) {
        Icon = Send;
        iconColor = 'bg-green-500';
    }

    // Se for nota manual, usa layout de balão de chat
    if (isManualNote) {
        return (
            <div className="flex gap-3 my-4">
                <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={avatarColors}
                >
                    {authorInitials}
                </div>
                <div className="flex-grow">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p className="text-sm text-gray-800">{note.note}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        <span className="font-semibold" style={{ color: avatarColors.color }}>{authorName}</span> • {format(new Date(note.created_at), "d MMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                </div>
            </div>
        );
    }

    // Se for atividade do sistema, usa layout de evento na timeline
    return (
        <div className="flex items-center gap-4 my-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <div className={`flex items-center gap-2 text-xs p-2 rounded-full ${iconColor.replace('bg-', 'bg-opacity-10 text-')}`}>
                <Icon className="w-4 h-4" />
                <div className="text-xs">
                    <span className="font-semibold">{authorName}</span>
                    {' '}{note.note.toLowerCase().includes('status') ? 'alterou o status para' : 'enviou o e-mail:'}{' '}
                    <span className="font-semibold">"{note.note.split('"')[1]}"</span>
                    <span className="ml-2 text-gray-500/80">{format(new Date(note.created_at), "HH:mm")}</span>
                </div>
            </div>
            <div className="flex-grow border-t border-gray-200"></div>
        </div>
    );
};

const EMAIL_TEMPLATES = [
    {
        id: 'interview',
        name: 'Convite para Entrevista',
        subject: 'Convite para Entrevista na CGB Energia - Vaga de {{vaga}}',
        body: `Olá, {{candidato}}!\n\nRecebemos sua aplicação para a vaga de {{vaga}} e ficamos muito interessados no seu perfil.\n\nGostaríamos de convidá-lo(a) para uma entrevista para nos conhecermos melhor.\n\nVocê teria disponibilidade nos próximos dias? Por favor, nos informe os melhores horários para você.\n\nAtenciosamente,\nEquipe de Recrutamento CGB Energia`,
    },
    {
        id: 'rejection',
        name: 'Feedback Negativo',
        subject: 'Retorno sobre o processo seletivo para a vaga de {{vaga}}',
        body: `Olá, {{candidato}}.\n\nAgradecemos seu interesse na vaga de {{vaga}} e o tempo que dedicou ao nosso processo seletivo.\n\nNeste momento, optamos por seguir com outros candidatos cujo perfil estava mais alinhado aos requisitos da vaga. Manteremos seu currículo em nosso banco de talentos para futuras oportunidades.\n\nDesejamos sucesso em sua jornada profissional.\n\nAtenciosamente,\nEquipe de Recrutamento CGB Energia`,
    },
];


const CandidateDetailModal = ({ candidate, isOpen, onClose }: CandidateDetailModalProps) => {
    const { user } = useAuth();
    const { data: notes = [], isLoading: isLoadingNotes } = useCandidateNotes(candidate?.id || null);
    const createNote = useCreateCandidateNote();
    const { toast } = useToast();
    const [newNote, setNewNote] = useState("");
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [whatsappBody, setWhatsappBody] = useState("");
    const [communicationChannel, setCommunicationChannel] = useState<'email' | 'whatsapp'>('email');

    const handleTemplateChange = (templateId: string) => {
        const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
        if (template && candidate) {
            setSelectedTemplate(templateId);

            const candidateName = candidate.name.split(' ')[0]; // Usar apenas o primeiro nome
            const jobTitle = candidate.job?.title || 'Não especificado';

            // Para E-mail
            setEmailSubject(template.subject.replace('{{vaga}}', jobTitle));
            setEmailBody(
                template.body
                    .replace('{{candidato}}', candidate.name)
                    .replace('{{vaga}}', jobTitle)
            );

            // Para WhatsApp (mais informal)
            setWhatsappBody(
                template.body
                    .replace('Olá, {{candidato}}.', `Olá, ${candidateName}!`)
                    .replace('Olá, {{candidato}}!', `Olá, ${candidateName}!`)
                    .replace('Recebemos sua aplicação para a vaga de {{vaga}} e ficamos muito interessados no seu perfil.', `Sobre sua candidatura para a vaga de ${jobTitle} na CGB Energia, temos novidades!`)
                    .replace('Agradecemos seu interesse na vaga de {{vaga}} e o tempo que dedicou ao nosso processo seletivo.', `Sobre o processo seletivo para a vaga de ${jobTitle}, gostaríamos de dar um retorno.`)
                    .replace(/\n\n/g, '\n') // Remove duplas quebras de linha
                    .replace('Atenciosamente,\nEquipe de Recrutamento CGB Energia', 'Atenciosamente,\nEquipe CGB Energia')
            );
        }
    };

    const handleAddNote = () => {
        if (!newNote.trim() || !candidate?.id || !user?.id) return;

        createNote.mutate({
            candidate_id: candidate.id,
            author_id: user.id,
            note: newNote,
            activity_type: 'Nota adicionada',
        }, {
            onSuccess: () => setNewNote(""),
        });
    };

    const handleSendEmail = async () => {
        if (!candidate || !emailSubject || !emailBody) return;

        setIsSendingEmail(true);
        try {
            const { error } = await supabase.functions.invoke('send-email', {
                body: {
                    to: candidate.email,
                    subject: emailSubject,
                    html: emailBody.replace(/\\n/g, '<br>'), // Converte quebras de linha para HTML
                },
            });

            if (error) throw new Error(error.message);

            toast({
                title: "E-mail enviado com sucesso!",
                description: `Um e-mail foi enviado para ${candidate.name}.`,
            });

            // Adicionar nota automática
            if (user) {
                createNote.mutate({
                    candidate_id: candidate.id,
                    author_id: user.id,
                    note: `E-mail enviado: "${emailSubject}"`,
                    activity_type: 'Comunicação',
                });
            }

        } catch (error: any) {
            toast({
                title: "Erro ao enviar e-mail",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleSendWhatsApp = async () => {
        if (!candidate || !whatsappBody) return;

        // Limpa o número de telefone, mantendo apenas dígitos
        const phoneNumber = candidate.phone?.replace(/\D/g, '');

        if (!phoneNumber) {
            toast({
                title: "Erro",
                description: "O candidato não possui um número de telefone válido.",
                variant: "destructive",
            });
            return;
        }

        const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(whatsappBody)}`;
        window.open(whatsappUrl, '_blank');

        // Adicionar nota automática
        if (user) {
            createNote.mutate({
                candidate_id: candidate.id,
                author_id: user.id,
                note: `Contato via WhatsApp iniciado.`,
                activity_type: 'Comunicação',
            });
        }
    };

    if (!candidate) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center space-x-4">
                        <div className="bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl">{candidate.name}</DialogTitle>
                            <DialogDescription>
                                Aplicado para a vaga de: {candidate.job?.title || "Não especificado"}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="activities" className="flex-grow flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-3 border-b">
                        <TabsTrigger value="activities" className="flex items-center gap-2 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-cgb-primary data-[state=active]:text-cgb-primary">
                            <List className="w-4 h-4" />
                            Notas e Atividades
                        </TabsTrigger>
                        <TabsTrigger value="communication" className="flex items-center gap-2 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-cgb-primary data-[state=active]:text-cgb-primary">
                            <Send className="w-4 h-4" />
                            Comunicação
                        </TabsTrigger>
                        <TabsTrigger value="details" className="flex items-center gap-2 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-cgb-primary data-[state=active]:text-cgb-primary">
                            <Info className="w-4 h-4" />
                            Detalhes
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="activities" className="flex-grow overflow-y-auto mt-4 pr-2 space-y-6">
                        <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 py-2">
                            <Textarea
                                placeholder="Adicionar uma nota sobre o candidato..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                className="mb-2"
                            />
                            <Button onClick={handleAddNote} disabled={createNote.isPending || !newNote.trim()}>
                                {createNote.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Adicionar Nota
                            </Button>
                        </div>

                        <div className="relative">
                            {isLoadingNotes ? (
                                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                            ) : (
                                notes.map((note, index) => (
                                    <TimelineItem key={note.id} note={note} />
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="communication" className="flex-grow overflow-y-auto mt-4 pr-2 space-y-4">
                        <div className="flex justify-center p-1 bg-gray-100 rounded-lg mb-4">
                            <Button
                                onClick={() => setCommunicationChannel('email')}
                                variant={communicationChannel === 'email' ? 'primary' : 'ghost'}
                                className={`w-full transition-all ${communicationChannel === 'email' ? 'font-bold' : ''}`}
                            >
                                <Mail className="w-4 h-4 mr-2" /> E-mail
                            </Button>
                            <Button
                                onClick={() => setCommunicationChannel('whatsapp')}
                                variant={communicationChannel === 'whatsapp' ? 'primary' : 'ghost'}
                                className={`w-full transition-all ${communicationChannel === 'whatsapp' ? 'font-bold' : ''}`}
                            >
                                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Template de Mensagem</label>
                            <Select onValueChange={handleTemplateChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um template..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {EMAIL_TEMPLATES.map(template => (
                                        <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {communicationChannel === 'email' ? (
                            <>
                                <div className="space-y-2">
                                    <label htmlFor="email-subject" className="text-sm font-medium">Assunto</label>
                                    <Input id="email-subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Assunto do e-mail" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email-body" className="text-sm font-medium">Corpo do E-mail</label>
                                    <Textarea id="email-body" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={10} placeholder="Escreva sua mensagem..." />
                                </div>
                                <Button onClick={handleSendEmail} disabled={!emailSubject || !emailBody || isSendingEmail}>
                                    {isSendingEmail ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="mr-2 h-4 w-4" />
                                    )}
                                    {isSendingEmail ? 'Enviando...' : 'Enviar E-mail'}
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label htmlFor="whatsapp-body" className="text-sm font-medium">Corpo da Mensagem</label>
                                    <Textarea id="whatsapp-body" value={whatsappBody} onChange={(e) => setWhatsappBody(e.target.value)} rows={10} placeholder="Escreva sua mensagem para o WhatsApp..." />
                                </div>
                                <Button onClick={handleSendWhatsApp} disabled={!whatsappBody}>
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    Enviar via WhatsApp
                                </Button>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="details" className="flex-grow overflow-y-auto mt-4">
                        <div className="py-4 space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Informações de Contato</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    <span>{candidate.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                    <span>{candidate.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 col-span-2">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    <span>{candidate.city}, {candidate.state}</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-auto pt-4 border-t">
                    <Button onClick={onClose} variant="outline">Fechar</Button>
                    <Button asChild>
                        <a href={candidate.resume_file_url || '#'} target="_blank" rel="noopener noreferrer" className={!candidate.resume_file_url ? 'pointer-events-none opacity-50' : ''}>Ver Currículo</a>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CandidateDetailModal; 