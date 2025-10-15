import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Users, UserCheck, Archive, Loader2, LayoutDashboard, ThumbsUp, UserX } from "lucide-react";
import { useCandidates } from "@/hooks/useCandidates";
import { useResumes } from "@/hooks/useResumes";
import { useAllJobs } from "@/hooks/useJobs";
import { useToast } from "@/hooks/use-toast";
import { format, subMonths, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAllRejectionNotes } from "@/hooks/useAllRejectionNotes";

const ReportsManagement = () => {
    const { data: candidates = [], isLoading: isLoadingCandidates } = useCandidates();
    const { data: resumes = [], isLoading: isLoadingResumes } = useResumes();
    const { data: jobs = [], isLoading: isLoadingJobs } = useAllJobs();
    const { data: rejectionNotes = [], isLoading: isLoadingRejectionNotes } = useAllRejectionNotes();
    const { toast } = useToast();

    const isLoading = isLoadingCandidates || isLoadingResumes || isLoadingJobs || isLoadingRejectionNotes;

    // Determina o status exibido no portal para a vaga exportada
    const getJobPortalStatus = (job: any): string => {
        const status = String(job?.status || '').toLowerCase();
        const approval = String(job?.approval_status || '').toLowerCase();
        const flow = String(job?.flow_status || '').toLowerCase();

        // 1) Encerramentos e rejeições primeiro
        if (['closed', 'fechado'].includes(status) || ['closed', 'fechado'].includes(approval)) return 'Encerrada';
        if (['rejected', 'rejeitado'].includes(approval)) return 'Rejeitada';
        if (['inactive', 'inativa'].includes(status)) return 'Inativa';
        if (flow === 'concluida') return 'Concluída';
        if (flow === 'congelada') return 'Congelada';

        // 2) Expiração
        if (job?.expires_at) {
            const expiresAt = new Date(job.expires_at);
            if (!isNaN(expiresAt.getTime()) && expiresAt < new Date()) {
                return 'Expirada';
            }
        }

        // 3) Ativa (mesmo que flow esteja vazio em dados antigos)
        const isActive = ['active', 'ativo'].includes(status);
        const isApproved = ['active', 'ativo'].includes(approval);
        if (isActive && isApproved && (flow === 'ativa' || flow === '' || flow === 'null' || flow === 'undefined')) {
            return 'Ativa';
        }

        // 4) Pendente de aprovação
        if (['pending_approval', 'aprovacao_pendente'].includes(approval)) return 'Aprovação Pendente';

        // 5) Fallback
        return 'Indefinido';
    };

    const downloadCSV = (data: string, filename: string) => {
        const blob = new Blob(['\uFEFF' + data], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Exportação Concluída!", description: `${filename} foi baixado com sucesso.` });
    };

    const handleExport = (type: 'candidates' | 'hired' | 'talentBank' | 'dashboard' | 'approvedJobs' | 'rejectedCandidates') => {
        if (isLoading) {
            toast({ title: "Aguarde", description: "Os dados ainda estão sendo carregados.", variant: "destructive" });
            return;
        }

        let csvContent = "";
        let headers: string[] = [];
        let filename = "";
        let rows: string[][] = [];

        switch (type) {
            case 'candidates':
                headers = ['Nome', 'Email', 'Telefone', 'Vaga Aplicada', 'Status', 'Localização', 'Possui CNH', 'Tipo de Veículo', 'Link do Currículo'];
                rows = candidates
                    .filter(c => c.job_id !== null)
                    .map(c => [
                        c.name || '', c.email || '', c.phone || '',
                        c.job?.title || 'N/A', c.status || 'N/A',
                        `${c.city || ''}, ${c.state || ''}`,
                        (c.cnh && c.cnh.toLowerCase() !== 'não possuo') ? 'Sim' : 'Não',
                        c.vehicle || 'N/A',
                        c.resume_file_url || ''
                    ]);
                filename = "relatorio_candidatos_gerais.csv";
                break;

            case 'hired':
                headers = ['Nome', 'Email', 'Telefone', 'Vaga Contratada', 'Data da Aprovação', 'Link do Currículo'];
                rows = candidates
                    .filter(c => c.status === 'Aprovado')
                    .map(c => [
                        c.name || '', c.email || '', c.phone || '',
                        c.job?.title || 'N/A',
                        format(new Date(c.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
                        c.resume_file_url || ''
                    ]);
                filename = "relatorio_contratados.csv";
                break;

            case 'talentBank':
                headers = ['Nome', 'Email', 'Telefone', 'Cargo Desejado', 'Estado', 'Cidade', 'Data de Envio', 'Link do Currículo'];
                rows = resumes.map(r => [
                    r.name || '', r.email || '', r.phone || '',
                    r.position || 'N/A', r.state || '', r.city || '',
                    new Date(r.submitted_date).toLocaleDateString('pt-BR'),
                    r.resume_file_url || ''
                ]);
                filename = "relatorio_banco_de_talentos.csv";
                break;

            case 'dashboard':
                headers = ['Métrica', 'Valor', 'Descrição'];

                // 1. Vagas Abertas
                const activeJobs = jobs.filter(j => j.status === 'active').length;

                // 2. Total de Candidatos
                const totalCandidates = candidates.length;

                // 3. Candidatos Aprovados
                const approvedCandidates = candidates.filter(c => c.status === 'Aprovado');
                const approvedCount = approvedCandidates.length;

                // 4. Taxa de Conversão
                const conversionRate = totalCandidates > 0 ? `${Math.round((approvedCount / totalCandidates) * 100)}%` : "0%";

                // 5. Tempo Médio de Contratação
                let totalHiringTime = 0;
                approvedCandidates.forEach(candidate => {
                    const job = jobs.find(j => j.id === candidate.job_id);
                    if (job && job.created_at && candidate.updated_at) {
                        totalHiringTime += differenceInDays(new Date(candidate.updated_at), new Date(job.created_at));
                    }
                });
                const avgTimeToHire = approvedCount > 0 ? `${Math.round(totalHiringTime / approvedCount)} dias` : "0 dias";

                // 6. Contratações no Mês
                const oneMonthAgo = subMonths(new Date(), 1);
                const hiresThisMonth = approvedCandidates.filter(c => new Date(c.updated_at) > oneMonthAgo).length;

                // 7. Vagas Aprovadas
                const approvedJobsCount = jobs.filter(j => j.approval_status === 'active').length;

                // 8. Candidatos Reprovados
                const rejectedCandidatesCount = candidates.filter(c => c.status === 'Reprovado').length;

                let csvRows = [
                    headers,
                    ['Vagas Abertas', activeJobs, 'Total de vagas ativas'],
                    ['Total de Candidatos', totalCandidates, 'Total de candidatos no sistema'],
                    ['Candidatos Aprovados', approvedCount, 'Total de contratados através do portal'],
                    ['Taxa de Conversão', conversionRate, 'Percentual de candidatos que foram aprovados'],
                    ['Tempo Médio de Contratação', avgTimeToHire, 'Média de dias desde a criação da vaga até a contratação'],
                    ['Contratações no Mês', hiresThisMonth, 'Novos talentos aprovados no último mês'],
                    ['Vagas Processadas', approvedJobsCount, 'Total de requisições de vagas processadas pelos gestores'],
                    ['Candidatos Reprovados', rejectedCandidatesCount, 'Candidatos que não passaram no processo seletivo']
                ];

                if (csvRows.length <= 1) {
                    toast({ title: "Nenhum dado encontrado", description: "Não há dados para exportar neste relatório.", variant: "destructive" });
                    return;
                }
                csvContent = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
                filename = "relatorio_dashboard.csv";
                break;

            case 'approvedJobs':
                headers = ['Título da Vaga', 'Departamento', 'Local', 'Data de Aprovação', 'Status no Portal'];
                rows = jobs
                    .filter(j => j.approval_status === 'active')
                    .map(j => [
                        j.title || '',
                        j.department || '',
                        `${j.city || ''}, ${j.state || ''}`,
                        format(new Date(j.updated_at), "dd/MM/yyyy", { locale: ptBR }),
                        getJobPortalStatus(j)
                    ]);
                filename = "relatorio_vagas_aprovadas.csv";
                break;

            case 'rejectedCandidates':
                headers = ['Nome', 'Email', 'Vaga Aplicada', 'Data da Reprovação', 'Motivo da Reprovação'];
                rows = candidates
                    .filter(c => c.status === 'Reprovado')
                    .map(c => {
                        const note = rejectionNotes.find(n => n.candidate_id === c.id);
                        return [
                            c.name || '',
                            c.email || '',
                            c.job?.title || 'N/A',
                            note ? format(new Date(note.created_at), "dd/MM/yyyy", { locale: ptBR }) : 'N/A',
                            note?.note.replace('Motivo da reprovação: ', '') || 'Motivo não especificado'
                        ]
                    });
                filename = "relatorio_candidatos_reprovados.csv";
                break;

        }

        if (type !== 'dashboard') {
            if (rows.length === 0) {
                toast({ title: "Nenhum dado encontrado", description: "Não há dados para exportar neste relatório.", variant: "destructive" });
                return;
            }
            // Constrói o conteúdo do CSV
            const headerString = headers.join(',');
            const rowStrings = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
            csvContent = [headerString, ...rowStrings].join('\n');
        }

        downloadCSV(csvContent, filename);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Central de Relatórios</h1>
                <p className="text-gray-500 mt-1">Exporte os dados do sistema em formato CSV com um único clique.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><Users className="w-6 h-6 text-cgb-primary" /><span>Candidatos Gerais</span></CardTitle>
                        <CardDescription>Exporte uma lista completa de todos os candidatos cadastrados no sistema, incluindo seus dados de contato e status atual.</CardDescription>
                    </CardHeader>
                    <CardContent />
                    <CardFooter>
                        <Button onClick={() => handleExport('candidates')} disabled={isLoading} className="w-full bg-cgb-primary hover:bg-cgb-primary-dark">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                            Exportar CSV
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><UserCheck className="w-6 h-6 text-green-600" /><span>Candidatos Contratados</span></CardTitle>
                        <CardDescription>Gere um relatório focado apenas nos candidatos que foram efetivamente contratados, com detalhes da vaga e data de aprovação.</CardDescription>
                    </CardHeader>
                    <CardContent />
                    <CardFooter>
                        <Button onClick={() => handleExport('hired')} disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                            Exportar CSV
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><Archive className="w-6 h-6 text-sky-600" /><span>Cadastro de Currículos</span></CardTitle>
                        <CardDescription>Baixe a lista de candidatos que cadastraram seus currículos, ideal para buscar perfis para futuras oportunidades.</CardDescription>
                    </CardHeader>
                    <CardContent />
                    <CardFooter>
                        <Button onClick={() => handleExport('talentBank')} disabled={isLoading} className="w-full bg-sky-600 hover:bg-sky-700">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                            Exportar CSV
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
                            <span>Relatório do Dashboard</span>
                        </CardTitle>
                        <CardDescription>
                            Exporte um resumo com as principais métricas de desempenho e acompanhamento de todo o processo de recrutamento.
                        </CardDescription>
                    </CardHeader>
                    <CardContent />
                    <CardFooter>
                        <Button onClick={() => handleExport('dashboard')} disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                            Exportar CSV
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><ThumbsUp className="w-6 h-6 text-cyan-600" /><span>Vagas Processadas</span></CardTitle>
                        <CardDescription>Exporte a lista de todas as vagas que foram processadas pelos gestores e se tornaram ativas no portal.</CardDescription>
                    </CardHeader>
                    <CardContent />
                    <CardFooter>
                        <Button onClick={() => handleExport('approvedJobs')} disabled={isLoading} className="w-full bg-cyan-600 hover:bg-cyan-700">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                            Exportar CSV
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><UserX className="w-6 h-6 text-red-600" /><span>Candidatos Reprovados</span></CardTitle>
                        <CardDescription>Liste todos os candidatos reprovados e os motivos, ajudando a analisar e otimizar o funil de seleção.</CardDescription>
                    </CardHeader>
                    <CardContent />
                    <CardFooter>
                        <Button onClick={() => handleExport('rejectedCandidates')} disabled={isLoading} className="w-full bg-red-600 hover:bg-red-700">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                            Exportar CSV
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default ReportsManagement; 