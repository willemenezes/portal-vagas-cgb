import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { CandidateReportData } from '@/hooks/useCandidateReport';

// Função para traduzir status jurídico
const translateLegalStatus = (status: string | null | undefined): string => {
    if (!status) return 'Pendente';
    
    const statusMap: Record<string, string> = {
        'pending': 'Pendente',
        'approved': 'Aprovado',
        'rejected': 'Reprovado',
        'request_changes': 'Solicitar Alterações'
    };
    
    return statusMap[status] || status;
};

export async function generateCandidateReportPDF(report: CandidateReportData) {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const margin = 40;
    let cursorY = margin;

    // Cabeçalho
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Relatório do Processo Seletivo', margin, cursorY);
    cursorY += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, cursorY);

    // Seção: Dados do Candidato
    cursorY += 30;
    autoTable(doc, {
        startY: cursorY,
        head: [['Campo', 'Valor']],
        body: [
            ['Nome', report.candidate?.name || ''],
            ['E-mail', report.candidate?.email || ''],
            ['Telefone', report.candidate?.phone || ''],
            ['Localização', `${report.candidate?.city || ''} - ${report.candidate?.state || ''}`],
            ['Status', report.candidate?.status || ''],
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [106, 11, 39] },
        theme: 'grid',
        margin: { left: margin, right: margin }
    });
    cursorY = (doc as any).lastAutoTable.finalY + 20;

    // Seção: Vaga
    const jobBody: any[] = [
        ['Vaga', report.job?.title || 'N/A'],
        ['Departamento', report.job?.department || 'N/A'],
        ['Localização da Vaga', `${report.job?.city || ''} - ${report.job?.state || ''}`]
    ];

    // Adicionar dados do solicitante se existirem
    if (report.job?.solicitante_nome) {
        jobBody.push(['Solicitante', report.job.solicitante_nome]);
    }
    if (report.job?.solicitante_funcao) {
        jobBody.push(['Gerente Responsável', report.job.solicitante_funcao]);
    }
    if (report.job?.tipo_solicitacao) {
        jobBody.push(['Tipo de Solicitação', report.job.tipo_solicitacao]);
    }
    if (report.job?.nome_substituido) {
        jobBody.push(['Nome do Substituído', report.job.nome_substituido]);
    }

    autoTable(doc, {
        startY: cursorY,
        head: [['Campo', 'Valor']],
        body: jobBody,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [106, 11, 39] },
        theme: 'grid',
        margin: { left: margin, right: margin }
    });
    cursorY = (doc as any).lastAutoTable.finalY + 20;

    // Seção: Dados Jurídicos
    if (report.legalData) {
        autoTable(doc, {
            startY: cursorY,
            head: [['Campo', 'Valor']],
            body: [
                ['CPF', report.legalData.cpf || ''],
                ['RG', report.legalData.rg || ''],
                ['Nascimento', report.legalData.birth_date ? new Date(report.legalData.birth_date).toLocaleDateString('pt-BR') : ''],
                ['Naturalidade', `${report.legalData.birth_city || ''}/${report.legalData.birth_state || ''}`],
                ['Status Jurídico', translateLegalStatus(report.legalData.review_status)],
                ['Observações', report.legalData.review_notes || '']
            ],
            styles: { fontSize: 10 },
            headStyles: { fillColor: [106, 11, 39] },
            theme: 'grid',
            margin: { left: margin, right: margin }
        });
        cursorY = (doc as any).lastAutoTable.finalY + 20;
    }

    // Seção: Aprovações da Solicitação de Vaga
    if (report.approvals?.request) {
        const req = report.approvals.request;
        autoTable(doc, {
            startY: cursorY,
            head: [['Campo', 'Valor']],
            body: [
                ['Status Solicitação', req.status],
                ['Aprovado por', req.approved_by || ''],
                ['Aprovado em', req.approved_at ? new Date(req.approved_at).toLocaleString('pt-BR') : ''],
                ['Justificativa/Notas', req.notes || '']
            ],
            styles: { fontSize: 10 },
            headStyles: { fillColor: [106, 11, 39] },
            theme: 'grid',
            margin: { left: margin, right: margin }
        });
        cursorY = (doc as any).lastAutoTable.finalY + 20;
    }

    // Seção: Linha do Tempo
    if (report.history && report.history.length > 0) {
        const rows = report.history.map((h) => [
            new Date(h.created_at).toLocaleString('pt-BR'),
            h.activity_type,
            h.type === 'legal_validation' ? (h.validator_name || h.author?.full_name || 'Sistema') : (h.author?.full_name || 'Sistema'),
            h.content || ''
        ]);

        autoTable(doc, {
            startY: cursorY,
            head: [['Data', 'Atividade', 'Autor', 'Detalhes']],
            body: rows,
            styles: { fontSize: 9, cellWidth: 'wrap' },
            columnStyles: {
                0: { cellWidth: 110 },
                1: { cellWidth: 120 },
                2: { cellWidth: 120 },
                3: { cellWidth: 'auto' },
            },
            headStyles: { fillColor: [106, 11, 39] },
            theme: 'grid',
            margin: { left: margin, right: margin }
        });
    }

    const fileName = `relatorio-${report.candidate?.name?.replace(/\s+/g, '_')}-${Date.now()}.pdf`;
    const blob = doc.output('blob');
    return { blob, fileName };
}


// ==========================
// Guia: Cloudflare + Vercel
// ==========================
export async function generateCloudflareGuidePDF() {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const margin = 40;
    let y = margin;

    const addTitle = (text: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(text, margin, y);
        y += 18;
    };

    const addSubtitle = (text: string) => {
        y += 14;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(text, margin, y);
        y += 8;
    };

    const addParagraph = (text: string) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(text, 515);
        doc.text(lines, margin, y);
        y += lines.length * 14;
    };

    const addList = (items: string[]) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        items.forEach((item) => {
            const lines = doc.splitTextToSize(`• ${item}`, 515);
            doc.text(lines, margin, y);
            y += lines.length * 14;
        });
    };

    const ensureSpace = (needed = 120) => {
        if (y + needed > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
        }
    };

    // Header
    addTitle('Guia de Configuração: Cloudflare + Vercel (CGB Vagas)');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, y + 6);
    y += 24;

    // Benefícios
    addSubtitle('Por que usar Cloudflare neste projeto?');
    addList([
        'CDN global e cache para imagens e assets (carregamento mais rápido)',
        'Compressão Brotli, minificação automática e HTTP/3',
        'Proteção DDoS, WAF básico e Bot Fight Mode',
        'SSL/TLS gerenciado e alta disponibilidade',
    ]);
    ensureSpace();

    // Passos
    addSubtitle('Passo 1: Criar conta no Cloudflare');
    addList([
        'Acesse dash.cloudflare.com e crie sua conta (ou faça login).',
        'Confirme o e-mail para ativar a conta.',
    ]);

    addSubtitle('Passo 2: Adicionar o domínio');
    addList([
        'Clique em “Add a Site” e informe: cgbvagas.com.br.',
        'Selecione o plano Free.',
        'Aguarde o scan dos registros DNS atuais.',
    ]);
    ensureSpace();

    addSubtitle('Passo 3: Ajustar DNS');
    addList([
        'Confirme os registros principais:',
        'A (root) → IP gerenciado pela Vercel; CNAME (www) → cgbvagas.com.br.',
        'Ative o Proxy (nuvem laranja) para ambos.',
    ]);

    addSubtitle('Passo 4: Apontar os Nameservers');
    addList([
        'Anote os 2 nameservers fornecidos pelo Cloudflare.',
        'No registrador do domínio, substitua pelos novos nameservers.',
        'Aguarde a propagação (normalmente 1-2 horas).',
    ]);
    ensureSpace();

    addSubtitle('Passo 5: Cache e Desempenho');
    addList([
        'Speed → Caching: Cache Level = Standard; Browser Cache TTL = 4h.',
        'Opcional (Page Rule): Cache Everything em cgbvagas.com.br/*, Edge Cache TTL = 1mês, Browser TTL = 1dia.',
    ]);

    addSubtitle('Passo 6: Otimizações de velocidade');
    addList([
        'Ative Auto Minify (HTML, CSS, JS) e Brotli.',
        'Ative HTTP/3 (QUIC) e Early Hints (se disponível).',
    ]);

    addSubtitle('Passo 7: Segurança');
    addList([
        'Security Level = Medium.',
        'Ative Bot Fight Mode (gratuito).',
        'WAF básico ativado por padrão no plano Free.',
    ]);
    ensureSpace();

    addSubtitle('Passo 8: Verificar na Vercel');
    addList([
        'No projeto Vercel → Settings → Domains: confirme cgbvagas.com.br e www.',
        'Faça um redeploy se necessário para renovar certificados.',
    ]);

    addSubtitle('Passo 9: Testes e validação');
    addList([
        'Abra o site e verifique nos DevTools / Network o header cf-cache-status (HIT/MISS).',
        'Execute um Lighthouse – Performance deve aproximar-se de 90+. ',
        'Monitore em Cloudflare → Analytics: tráfego, bandwidth, cache hit ratio.',
    ]);

    addSubtitle('Dicas finais');
    addList([
        'Evite regras que façam cache de rotas dinâmicas sensíveis.',
        'Se precisar ignorar cache em uma rota, use Page Rules ou Cache Rules específicas.',
        'Para problemas de propagação DNS, valide em dnschecker.org.',
    ]);

    // Rodapé
    y = doc.internal.pageSize.getHeight() - margin + 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('CGB Vagas — Guia de Configuração Cloudflare + Vercel', margin, y);

    const blob = doc.output('blob');
    const fileName = `guia-cloudflare-cgbvagas-${Date.now()}.pdf`;
    return { blob, fileName };
}







