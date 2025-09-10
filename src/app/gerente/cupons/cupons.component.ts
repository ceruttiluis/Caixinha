import { Router } from '@angular/router';
import { CommonModule, NgFor } from '@angular/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { FormsModule } from '@angular/forms';
import { Component, HostListener } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SidebarGerenteComponent } from '../shared-gerente/sidebar.component';
import { SharedModule } from '../../shared/shared.module';
import { environment } from '../../../environments/environment';
import { SharedService } from '../../shared/shared.service';

type CupomStatus = 'PENDENTE' | 'APROVADO' | 'DESCONTADO';

interface Cupom {
  id: number;
  usuarioID: string;
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
  link: string;
}

@Component({
  selector: 'app-cupons',
  templateUrl: './cupons.component.html',
  styleUrls: ['./cupons.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    NgFor,
    CommonModule,
    SidebarGerenteComponent,
    SharedModule
  ]
})
export class CuponsComponent {
  supabase: SupabaseClient;
  filialId: string | null = null;
  filialSelecionada?: string;
  tooltipOpenId: string | null = null;
  profiles: any[] = [];
  colaboradorId: string | null | undefined = undefined;
  periodoSelecionado: string | null | undefined = undefined;
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
    this.filialId = this.auth.getFilialId();
    this.carregarDados();
    await this.carregarUsuarios();
    this.carregarComFiltros();
  }

  onColaboradorChange() {
    console.log('Usuário selecionado:', this.colaboradorId);
    this.carregarDados();
  }
  async carregarUsuarios() {
    this.profiles = await this.sharedService.carregarProfiles(
      this.filialSelecionada || this.filialId
    );
  }
  async carregarDados(
    periodoSelecionado?: string | null,
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
      this.cupons = await this.sharedService.carregarCuponsGerente(
        this.filialSelecionada,
        this.colaboradorId,
        startDate,
        endDate
      );
      this.separarListas();
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
    }
  }
  async carregarComFiltros(filialId?: string, colaboradorId?: string) {
    this.cupons = await this.sharedService.carregarCuponsGerente(
      filialId,
      colaboradorId
    );
  }
  separarListas() {
    this.cuponsPendentes = this.cupons.filter(c => c.status === 'PENDENTE');
    this.cuponsAprovados = this.cupons.filter(c => c.status === 'APROVADO');
    this.cuponsReprovados = this.cupons.filter(c => c.status === 'DESCONTADO');
  }

  async atualizarStatusCarteira(cupom: Cupom, novoStatus: CupomStatus) {
    const { data, error } = await this.supabase
      .from('cupons')
      .update({ status: novoStatus, aprovado_por: this.auth.getUserId() })
      .eq('id', Number(cupom.id))
      .select('*')
      .maybeSingle();

    if (error) {
      console.error(`Erro ao atualizar cupom #${cupom.id}:`, error.message);
      return;
    }
    if (!data) {
      console.warn(`Nenhum cupom encontrado ou permitido para atualização: #${cupom.id}`);
      return;
    }
    if (novoStatus === 'APROVADO' || novoStatus === 'DESCONTADO') {

      const usuarioId = cupom.usuarioID;

      const { data: usuario, error: usuarioError } = await this.supabase
        .from('profiles')
        .select('carteira, filial_id, name, id')
        .eq('id', usuarioId)
        .maybeSingle();

      if (usuarioError || !usuario) {
        console.error(`Usuário não encontrado: ${usuarioId}`);
        return;
      }

      const novoSaldo = (usuario.carteira || 0) - (cupom.valor || 0);

      const { error: updateError } = await this.supabase
        .from('profiles')
        .update({ carteira: novoSaldo })
        .eq('id', usuarioId);

      if (updateError) {
        console.error('Erro ao atualizar saldo: ' + updateError.message);
        return;
      }
    }

    console.log(`Cupom atualizado no banco:`, data);

    this.cuponsPendentes = this.cuponsPendentes.filter(c => c.id !== cupom.id);
    this.cuponsAprovados = this.cuponsAprovados.filter(c => c.id !== cupom.id);
    this.cuponsReprovados = this.cuponsReprovados.filter(c => c.id !== cupom.id);

    cupom.status = novoStatus;
    if (novoStatus === 'APROVADO') this.cuponsAprovados.push(cupom);
    else if (novoStatus === 'DESCONTADO') this.cuponsReprovados.push(cupom);
    else this.cuponsPendentes.push(cupom);
  }

  async atualizarStatusCupom(cupom: Cupom, novoStatus: CupomStatus) {
    const { data, error } = await this.supabase
      .from('cupons')
      .update({ status: novoStatus, aprovado_por: this.auth.getUserId() })
      .eq('id', Number(cupom.id))
      .select('*')
      .maybeSingle();

    if (error) {
      console.error(`Erro ao atualizar cupom #${cupom.id}:`, error.message);
      return;
    }
    if (!data) {
      console.warn(`Nenhum cupom encontrado ou permitido para atualização: #${cupom.id}`);
      return;
    }

    console.log(`Cupom atualizado no banco:`, data);

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