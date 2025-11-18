import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Carregar logo da empresa
const loadLogo = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Não usar crossOrigin para arquivos locais
    img.src = '/CGB ENERGIA LOGO.png';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Não foi possível criar canvas'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      console.error('Erro ao carregar logo:', error);
      reject(new Error('Erro ao carregar logo da empresa'));
    };
    
    // Timeout de segurança
    setTimeout(() => {
      if (!img.complete) {
        reject(new Error('Timeout ao carregar logo'));
      }
    }, 5000);
  });
};

interface PDFReportOptions {
  title: string;
  headers: string[];
  rows: string[][];
  filename: string;
  description?: string;
}

export const generatePDFReport = async (options: PDFReportOptions): Promise<void> => {
  try {
    const logo = await loadLogo();
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape para mais espaço
    
    // Cores da empresa
    const primaryColor = [106, 11, 39]; // #6a0b27 (cgb-primary)
    
    // Cabeçalho com logo
    doc.addImage(logo, 'PNG', 15, 10, 40, 15);
    
    // Título
    doc.setFontSize(20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(options.title, 60, 20);
    
    // Data de geração
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Gerado em: ${dateStr}`, 60, 27);
    
    // Descrição (se houver)
    if (options.description) {
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(options.description, 15, 35);
    }
    
    // Tabela
    let startY = options.description ? 42 : 35;
    
    autoTable(doc, {
      head: [options.headers],
      body: options.rows,
      startY: startY,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: startY, left: 15, right: 15 },
      styles: {
        cellPadding: 2,
        overflow: 'linebreak',
        cellWidth: 'wrap',
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
      },
    });
    
    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount} - CGB Energia - Portal de Carreiras`,
        105,
        200,
        { align: 'center' }
      );
    }
    
    // Salvar
    doc.save(options.filename);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};

// Função específica para relatório de dashboard (formato diferente)
export const generateDashboardPDF = async (metrics: Array<{ metric: string; value: string | number; description: string }>): Promise<void> => {
  try {
    const logo = await loadLogo();
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const primaryColor = [106, 11, 39];
    
    // Cabeçalho
    doc.addImage(logo, 'PNG', 15, 10, 40, 15);
    doc.setFontSize(20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório do Dashboard', 60, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Gerado em: ${dateStr}`, 60, 27);
    
    // Métricas em formato de cards
    let yPos = 40;
    const cardHeight = 25;
    const cardWidth = 85;
    const margin = 15;
    const spacing = 10;
    
    metrics.forEach((metric, index) => {
      const xPos = index % 2 === 0 ? margin : margin + cardWidth + spacing;
      const currentY = margin + 30 + Math.floor(index / 2) * (cardHeight + spacing);
      
      // Card background
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(xPos, currentY, cardWidth, cardHeight, 3, 3, 'F');
      
      // Borda
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(xPos, currentY, cardWidth, cardHeight, 3, 3, 'S');
      
      // Métrica
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(metric.metric, xPos + 5, currentY + 8);
      
      // Valor
      doc.setFontSize(16);
      doc.setTextColor(50, 50, 50);
      doc.text(String(metric.value), xPos + 5, currentY + 16);
      
      // Descrição
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.setFont('helvetica', 'normal');
      const descriptionLines = doc.splitTextToSize(metric.description, cardWidth - 10);
      doc.text(descriptionLines, xPos + 5, currentY + 22);
    });
    
    // Rodapé
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('CGB Energia - Portal de Carreiras', 105, 285, { align: 'center' });
    
    doc.save('relatorio_dashboard.pdf');
  } catch (error) {
    console.error('Erro ao gerar PDF do dashboard:', error);
    throw error;
  }
};

