import { Router, NavigationEnd } from '@angular/router';
import { CommonModule, NgFor } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { supabase } from '../../services/supabaseClient';
import { FormsModule } from '@angular/forms';
import { Component, HostListener } from '@angular/core';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { SharedModule } from "../../shared/shared.module";
import { SharedService } from '../../services/shared.service';
import { CupomService } from '../../services/cupom.service';
import { NgZone } from '@angular/core';
import { filter } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LOGO_BASE64 } from '../../shared/logo';

type CupomStatus = 'PENDENTE' | 'APROVADO' | 'DESCONTADO';

interface Cupom {
  id: number;
  usuario: string;
  data: Date;
  tipo: string;
  valor: number;
  imagem: string;
  status: CupomStatus;
  diferenca: number;
  exceDeficit: number;
  descontar?: boolean;
  observacoes: string;
  aprovacao: string;
  link: string;
}

@Component({
  selector: 'app-cupons-ciop',
  templateUrl: './cupons-ciop.component.html',
  styleUrls: ['./cupons-ciop.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    NgFor,
    CommonModule,
    SidebarCiopComponent,
    SharedModule
  ]
})
export class CuponsCiopComponent {
  filialId: string | null | undefined = undefined;
  filiais: any[] = [];
  profiles: any[] = [];
  colaboradorId: string | null | undefined = undefined;
  tooltipOpenId: string | null = null;
  periodoSelecionado: string = '';
  dataInicio?: Date;
  dataFim?: Date;
  trimestreSelecionado: null | undefined;
  semestreSelecionado: null | undefined;
  mesSelecionado: null | undefined;

  cuponsPendentes: Cupom[] = [];
  cuponsAprovados: Cupom[] = [];
  cuponsReprovados: Cupom[] = [];
  cupons: any[] = [];

  constructor(
    private auth: AuthService,
    private router: Router,
    private sharedService: SharedService,
    private cupomService: CupomService,
    private ngZone: NgZone) { }

  async ngOnInit() {
    await this.carregarDados();
    await this.carregarUsuarios();
    await this.carregarFiliais();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.carregarDados();
      });
    this.carregarComFiltros();
  }

  onFilialChange() {
    console.log('Filial selecionada:', this.filialId);
    this.carregarUsuarios();
    this.carregarDados();
  }
  async carregarFiliais() {
    this.filiais = await this.sharedService.carregarFiliais();
    this.ngZone.run(() => {
      this.filiais = this.filiais;
    });
  }

  onColaboradorChange() {
    console.log('Usuário selecionado:', this.colaboradorId);
    this.carregarDados();
  }
  async carregarUsuarios() {
    this.profiles = await this.sharedService.carregarProfiles(
      this.filialId
    );
    this.ngZone.run(() => {
      this.profiles = this.profiles;
    });
  }
  async carregarComFiltros(filialId?: string, colaboradorId?: string) {
    this.cupons = await this.cupomService.carregarCuponsCiop(
      filialId,
      colaboradorId
    );
  }

  async carregarDados(
    periodoSelecionado?: string,
    dataInicio?: Date,
    dataFim?: Date
  ) {
    try {
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      if (periodoSelecionado) {
        const periodo = this.sharedService.calcularPeriodo(
          periodoSelecionado,
          dataInicio,
          dataFim,
          this.mesSelecionado,
          this.trimestreSelecionado,
          this.semestreSelecionado,
        );
        startDate = periodo.startDate || undefined;
        endDate = periodo.endDate || undefined;
      } else if (dataInicio && dataFim) {
        startDate = dataInicio;
        endDate = dataFim;
      }
      this.cupons = await this.cupomService.carregarCuponsCiop(
        this.filialId,
        this.colaboradorId,
        startDate,
        endDate
      );
      this.ngZone.run(() => {
        this.cupons = this.cupons;
        this.separarListas();
      });
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
    }
  }

  separarListas() {
    this.cuponsPendentes = this.cupons.filter(c => c.status === 'PENDENTE');
    this.cuponsAprovados = this.cupons.filter(c => c.status === 'APROVADO');
    this.cuponsReprovados = this.cupons.filter(c => c.status === 'DESCONTADO');
  }

  async atualizarStatusCupom(cupom: Cupom, novoStatus: CupomStatus) {
    const { error } = await supabase
      .from('cupons')
      .update({ status: novoStatus })
      .eq('id', cupom.id);

    if (error) {
      console.error(`Erro ao atualizar cupom #${cupom.id}:`, error.message);
      return;
    }

    this.cuponsPendentes = this.cuponsPendentes.filter(c => c.id !== cupom.id);
    this.cuponsAprovados = this.cuponsAprovados.filter(c => c.id !== cupom.id);
    this.cuponsReprovados = this.cuponsReprovados.filter(c => c.id !== cupom.id);

    cupom.status = novoStatus;
    if (novoStatus === 'APROVADO') this.cuponsAprovados.push(cupom);
    else if (novoStatus === 'DESCONTADO') this.cuponsReprovados.push(cupom);
    else this.cuponsPendentes.push(cupom);
  }

  isTooltipOpen(id: number | string): boolean {
    return this.tooltipOpenId === String(id);
  }

  toggleTooltip(id: number | string) {
    const key = String(id);
    this.tooltipOpenId = this.tooltipOpenId === key ? null : key;
  }

  @HostListener('document:click')
  closeTooltip() {
    this.tooltipOpenId = null;
  }
  exportarParaExcel() {
    this.sharedService.exportarParaExcel(this.cupons)
  }
  async aplicarFiltros() {
    const { startDate, endDate } = this.sharedService.calcularPeriodo(
      this.periodoSelecionado,
      this.dataInicio,
      this.dataFim,
      this.mesSelecionado,
      this.trimestreSelecionado,
      this.semestreSelecionado,
    );
    this.carregarDados(this.periodoSelecionado, startDate, endDate);
    this.separarListas();
  }

  async imageUrlToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async gerarPdf() {
    const doc = new jsPDF('l');
    doc.addImage(
    LOGO_BASE64,
    'PNG',
    14,   // X
    7,   // Y
    50,   // largura
    25    // altura
  );

    doc.setFontSize(14);
    doc.text('Relatório de Cupons Fiscais', 14, 15);

    const body = [];

    for (const c of this.cupons) {
      let imagemBase64 = '';

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
        c.observacoes || '-',
      ]);
    }
    const totalValor = this.cupons.reduce(
      (acc, c) => acc + Number(c.valor ?? 0),
      0
    );

    const totalExcedente = this.cupons.reduce(
      (acc, c) => acc + Number(c.exceDeficit ?? 0),
      0
    );
    const foot = [[
      'TOTAL',        // ID
      '',             // Usuário
      '',             // Data
      '',             // Tipo
      `R$ ${totalValor.toFixed(2)}`,      // Valor
      `R$ ${totalExcedente.toFixed(2)}`,  // Excedente
      '',             // Observações
      ''              // Imagem
    ]];

    autoTable(doc, {
      startY: 25,
      styles: {
        fontSize: 9,
        minCellHeight: 20,
        valign: 'middle'
      },
      head: [[
        'ID',
        'Usuário',
        'Data',
        'Tipo',
        'Valor',
        'Excedente',
        'Observações',
        'Imagem'
      ]],
      body,
      didDrawCell: (data) => {
        if (data.column.index === 7 && data.row.section === 'body') {
          const cupom = this.cupons[data.row.index];
          if (cupom?.__imgBase64) {
            const imgWidth = 16;
            const imgHeight = 16;

            const x = data.cell.x + (data.cell.width - imgWidth) / 2;
            const y = data.cell.y + (data.cell.height - imgHeight) / 2;
            doc.addImage(
              cupom.__imgBase64,
              'JPEG',
              data.cell.x + 2,
              data.cell.y + 2,
              18,
              14
            );
          }
        }
      }

    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo do Relatório', 14, finalY - 6);

    doc.setDrawColor(180);
    doc.setLineWidth(0.5);
    doc.line(14, finalY - 4, 280, finalY - 4);

    const textY = finalY + 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Total Gasto: R$ ${totalValor.toFixed(2)}`, 14, textY);
    doc.text(`Total Excedente/Déficit: R$ ${totalExcedente.toFixed(2)}`, 14, textY + 6);

    doc.save('relatorio-cupons.pdf');
  }
}