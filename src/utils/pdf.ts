import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { CandidateReportData } from '@/hooks/useCandidateReport';

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
    autoTable(doc, {
        startY: cursorY,
        head: [['Campo', 'Valor']],
        body: [
            ['Vaga', report.job?.title || 'N/A'],
            ['Departamento', report.job?.department || 'N/A'],
            ['Localização da Vaga', `${report.job?.city || ''} - ${report.job?.state || ''}`]
        ],
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
                ['Status Jurídico', report.legalData.review_status || 'pendente'],
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
            h.type === 'legal_validation' ? (h.legal_status || '') : '',
            h.author?.full_name || 'Sistema',
            h.content || ''
        ]);

        autoTable(doc, {
            startY: cursorY,
            head: [['Data', 'Atividade', 'Status Jurídico', 'Autor', 'Detalhes']],
            body: rows,
            styles: { fontSize: 9, cellWidth: 'wrap' },
            columnStyles: {
                0: { cellWidth: 110 },
                1: { cellWidth: 120 },
                2: { cellWidth: 120 },
                3: { cellWidth: 120 },
                4: { cellWidth: 'auto' },
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







