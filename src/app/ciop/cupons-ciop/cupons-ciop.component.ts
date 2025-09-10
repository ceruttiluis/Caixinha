import { Router } from '@angular/router';
import { CommonModule, NgFor } from '@angular/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { FormsModule } from '@angular/forms';
import { Component, HostListener } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { SharedModule } from "../../shared/shared.module";
import { SharedService } from '../../shared/shared.service';

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
  supabase: SupabaseClient;
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

  constructor(private auth: AuthService, private router: Router, private sharedService: SharedService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async ngOnInit() {
    await this.carregarDados();
    await this.carregarUsuarios();
    await this.carregarFiliais();
    this.carregarComFiltros();
  }

  onFilialChange() {
    console.log('Filial selecionada:', this.filialId);
    this.carregarUsuarios();
    this.carregarDados();
  }
  async carregarFiliais() {
    this.filiais = await this.sharedService.carregarFiliais();
  }

  onColaboradorChange() {
    console.log('Usuário selecionado:', this.colaboradorId);
    this.carregarDados();
  }
  async carregarUsuarios() {
    this.profiles = await this.sharedService.carregarProfiles(
      this.filialId
    );
  }
  async carregarComFiltros(filialId?: string, colaboradorId?: string) {
    this.cupons = await this.sharedService.carregarCuponsCiop(
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
      this.cupons = await this.sharedService.carregarCuponsCiop(
        this.filialId,
        this.colaboradorId,
        startDate,
        endDate
      );
      this.separarListas();
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
    const { error } = await this.supabase
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
}