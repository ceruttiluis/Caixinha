import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LOGO_BASE64 } from '../shared/logo';

@Injectable({
    providedIn: 'root'
})
export class PdfService {

    constructor() { }

    private async imageUrlToBase64(url: string): Promise<string> {
        const response = await fetch(url);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async gerarPdfCupons(
        cupons: any[],
        logoBase64: string,
        nomeArquivo = 'relatorio-cupons.pdf'
    ): Promise<void> {

        const doc = new jsPDF('l');
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.addImage(logoBase64, 'PNG', 14, 12, 40, 20);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('Relatório de Cupons Fiscais', 60, 20);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(90);
        doc.text('Caixinha', 60, 27);


        const dataGeracao = new Date().toLocaleDateString('pt-BR');
        doc.text(`Gerado em: ${dataGeracao}`, pageWidth - 14, 20, {
            align: 'right'
        });

        doc.setDrawColor(200);
        doc.setLineWidth(0.8);
        doc.line(14, 35, pageWidth - 14, 35);

        doc.setTextColor(0);

        const body: any[] = [];

        for (const c of cupons) {
            if (c.url_imagem) {
                try {
                    c.__imgBase64 = await this.imageUrlToBase64(c.url_imagem);
                } catch (e) {
                    console.error('Erro ao carregar imagem:', c.url_imagem);
                }
            }

            body.push([
                c.id ?? '-',
                c.usuario ?? '-',
                c.data ?? '-',
                c.tipo ?? '-',
                `R$ ${Number(c.valor ?? 0).toFixed(2)}`,
                `R$ ${Number(c.exceDeficit ?? 0).toFixed(2)}`,
                c.status ?? '-',
                c.observacoes || '-',
                '' // imagem
            ]);
        }

        const totalValor = cupons.reduce(
            (acc, c) => acc + Number(c.valor ?? 0),
            0
        );

        const totalExcedente = cupons.reduce(
            (acc, c) => acc + Number(c.exceDeficit ?? 0),
            0
        );

        autoTable(doc, {
            startY: 40,
            head: [[
                'ID',
                'Usuário',
                'Data',
                'Tipo',
                'Valor',
                'Excedente',
                'Status',
                'Observações',
                /*'Imagem'*/
            ]],
            body,
            theme: 'striped',
            headStyles: {
                fillColor: [15, 122, 75], // verde corporativo
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 9,
                valign: 'middle'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            columnStyles: {
                0: { halign: 'center' }, // ID
                4: { halign: 'right' },  // Valor
                5: { halign: 'right' },  // Excedente
            },
            /* didDrawCell: (data) => {
                 if (data.column.index === 7 && data.row.section === 'body') {
                     const cupom = cupons[data.row.index];
                     if (cupom?.__imgBase64) {
                         doc.addImage(
                             cupom.__imgBase64,
                             'JPEG',
                             data.cell.x + 2,
                             data.cell.y + 2,
                             16,
                             12
                         );
                     }
                 }
             }*/
        });

        const pageCount = doc.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            doc.setDrawColor(200);
            doc.line(14, doc.internal.pageSize.height - 18,
                pageWidth - 14, doc.internal.pageSize.height - 18);

            doc.setFontSize(9);
            doc.setTextColor(120);

            doc.text(
                'TERCEIRIZE+ • Relatório de Cupons',
                14,
                doc.internal.pageSize.height - 10
            );

            doc.text(
                `Página ${i} de ${pageCount}`,
                pageWidth - 14,
                doc.internal.pageSize.height - 10,
                { align: 'right' }
            );
        }

        const finalY = (doc as any).lastAutoTable.finalY + 14;

        /* CARD BACKGROUND */
        doc.setFillColor(245, 247, 250); // cinza claro
        doc.roundedRect(
            14,
            finalY - 10,
            pageWidth - 28,
            34,
            3,
            3,
            'F'
        );

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(15, 122, 75);
        doc.text('Resumo do Relatório', 20, finalY);

        doc.setDrawColor(200);
        doc.setLineWidth(0.6);
        doc.line(20, finalY + 2, pageWidth - 20, finalY + 2);

        /* CONTEÚDO */
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(60);

        /* LABELS */
        doc.text('Total Gasto:', 20, finalY + 12);
        doc.text('Total Excedente/Déficit:', 20, finalY + 20);

        /* VALORES (alinhados à direita) */
        doc.setFont('helvetica', 'bold');
        doc.text(
            `R$ ${totalValor.toFixed(2)}`,
            pageWidth - 20,
            finalY + 12,
            { align: 'right' }
        );

        doc.text(
            `R$ ${totalExcedente.toFixed(2)}`,
            pageWidth - 20,
            finalY + 20,
            { align: 'right' }
        );

        doc.setTextColor(0);

        doc.save(nomeArquivo);
    }

    async gerarPdfRecargas(
        solicitacoes: any[],
        logoBase64: string,
        nomeArquivo = 'relatorio-recargas.pdf'
    ): Promise<void> {
        const doc = new jsPDF('l');
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.addImage(logoBase64, 'PNG', 14, 12, 40, 20);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('Relatório de Racargas', 60, 20);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(90);
        doc.text('Caixinha', 60, 27);


        const dataGeracao = new Date().toLocaleDateString('pt-BR');
        doc.text(`Gerado em: ${dataGeracao}`, pageWidth - 14, 20, {
            align: 'right'
        });

        doc.setDrawColor(200);
        doc.setLineWidth(0.8);
        doc.line(14, 35, pageWidth - 14, 35);

        doc.setTextColor(0);

        const body: any[] = [];

        for (const s of solicitacoes) {

            body.push([
                s.id ?? '-',
                s.usuario ?? '-',
                s.filial ?? '-',
                s.data ?? '-',
                s.tipo ?? '-',
                `R$ ${Number(s.valor ?? 0).toFixed(2)}`,
                s.status ?? '-',
                s.observacoes || '-',
                s.aprovador || '-',
            ]);
        }

        const totalValor = solicitacoes.reduce(
            (acc, s) => acc + Number(s.valor ?? 0),
            0
        );

        autoTable(doc, {
            startY: 44,
            head: [[
                'ID',
                'Usuário',
                'Filial',
                'Data',
                'Tipo',
                'Valor',
                'Status',
                'Observações',
                'Aprovador',
            ]],
            body,
            theme: 'striped',
            headStyles: {
                fillColor: [15, 122, 75], // verde corporativo
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 9,
                valign: 'middle'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            columnStyles: {
                0: { halign: 'center' }, // ID
                4: { halign: 'right' },  // Valor
                5: { halign: 'right' },  // Excedente
            },
        });

        const pageCount = doc.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            doc.setDrawColor(200);
            doc.line(14, doc.internal.pageSize.height - 18,
                pageWidth - 14, doc.internal.pageSize.height - 18);

            doc.setFontSize(9);
            doc.setTextColor(120);

            doc.text(
                'TERCEIRIZE+ • Relatório de Recargas',
                14,
                doc.internal.pageSize.height - 10
            );

            doc.text(
                `Página ${i} de ${pageCount}`,
                pageWidth - 14,
                doc.internal.pageSize.height - 10,
                { align: 'right' }
            );
        }

        const finalY = (doc as any).lastAutoTable.finalY + 14;

        /* CARD BACKGROUND */
        doc.setFillColor(245, 247, 250); // cinza claro
        doc.roundedRect(
            14,
            finalY - 10,
            pageWidth - 28,
            34,
            3,
            3,
            'F'
        );

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(15, 122, 75);
        doc.text('Resumo do Relatório', 20, finalY);

        doc.setDrawColor(200);
        doc.setLineWidth(0.6);
        doc.line(20, finalY + 2, pageWidth - 20, finalY + 2);

        /* CONTEÚDO */
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(60);

        /* LABELS */
        doc.text('Total de Recarga:', 20, finalY + 12);

        /* VALORES (alinhados à direita) */
        doc.setFont('helvetica', 'bold');
        doc.text(
            `R$ ${totalValor.toFixed(2)}`,
            pageWidth - 20,
            finalY + 12,
            { align: 'right' }
        );

        doc.setTextColor(0);

        doc.save(nomeArquivo);
    }
}
