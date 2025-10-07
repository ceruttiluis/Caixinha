import { Router, NavigationEnd } from '@angular/router';
import { CommonModule, NgFor } from '@angular/common';
import { supabase } from '../../services/supabaseClient';
import { FormsModule } from '@angular/forms';
import { Component, HostListener } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SidebarGerenteComponent } from '../shared-gerente/sidebar.component';
import { SharedModule } from '../../shared/shared.module';
import { SharedService } from '../../services/shared.service';
import { NgZone } from '@angular/core';
import { filter } from 'rxjs/operators';

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

  constructor(
    private auth: AuthService,
    private router: Router,
    private sharedService: SharedService,
    private ngZone: NgZone) { }

  async ngOnInit() {
    this.filialId = this.auth.getFilialId();
    await this.carregarDados();
    await this.carregarUsuarios();
    this.carregarComFiltros();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.carregarDados();
        this.carregarUsuarios();
      });
  }

  onColaboradorChange() {
    console.log('Usuário selecionado:', this.colaboradorId);
    this.carregarDados();
  }
  async carregarUsuarios() {
    this.profiles = await this.sharedService.carregarProfiles(
      this.filialSelecionada || this.filialId
    );
    this.ngZone.run(() => {
      this.profiles = this.profiles;
    });
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
      this.ngZone.run(() => {
        this.cupons = this.cupons;
        this.separarListas();
      });
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
    const { data: cupomAtualizado, error: cupomErr } = await supabase
      .from('cupons')
      .update({ status: novoStatus, aprovado_por: this.auth.getUserId() })
      .eq('id', Number(cupom.id))
      .select('id, status, usuario_id, valor')
      .maybeSingle();

    if (cupomErr) {
      console.error(`Erro ao atualizar cupom #${cupom.id}:`, cupomErr.message);
      return;
    }
    if (!cupomAtualizado) {
      console.warn(`0 linhas afetadas ao atualizar cupom #${cupom.id} (id inválido ou RLS bloqueou).`);
      return;
    }
    if (novoStatus === 'APROVADO' || novoStatus === 'DESCONTADO') {

      const usuarioId = cupom.usuarioID ?? cupomAtualizado.usuario_id;
      const valorCupom = cupom.valor ?? cupomAtualizado.valor;

      if (!usuarioId) {
        console.error(`Usuário não encontrado no cupom #${cupom.id}`);
        return;
      }

      const { data: usuario, error: usuarioError } = await supabase
        .from('profiles')
        .select('id, carteira')
        .eq('id', usuarioId)
        .maybeSingle();

      if (usuarioError || !usuario) {
        console.error(`Usuário não encontrado: ${usuarioId}`);
        return;
      }
      console.log('Carteira', usuario.carteira);

      const novoSaldo = (usuario.carteira || 0) - (cupom.valor || 0);
      console.log(`Carteira atualizado no banco:`, novoSaldo);

      const { data: perfilAtualizado, error: walletErr } = await supabase
        .from('profiles')
        .update({ carteira: novoSaldo })
        .eq('id', usuarioId)
        .select('id, carteira')
        .maybeSingle();

      if (walletErr) {
        console.error('Erro ao atualizar saldo:', walletErr.message);
        return;
      }
      console.log('✅ Carteira depois do update:', perfilAtualizado?.carteira);
      this.ngZone.run(() => {
        this.cupons = this.cupons;
      });
    }

    console.log(`Cupom atualizado no banco:`, cupomAtualizado);

    this.cuponsPendentes = this.cuponsPendentes.filter(c => c.id !== cupom.id);
    this.cuponsAprovados = this.cuponsAprovados.filter(c => c.id !== cupom.id);
    this.cuponsReprovados = this.cuponsReprovados.filter(c => c.id !== cupom.id);

    cupom.status = novoStatus;
    if (novoStatus === 'APROVADO') this.cuponsAprovados.push(cupom);
    else if (novoStatus === 'DESCONTADO') this.cuponsReprovados.push(cupom);
    else this.cuponsPendentes.push(cupom);
  }

  async atualizarStatusCupom(cupom: Cupom, novoStatus: CupomStatus) {
    const { data, error } = await supabase
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
    this.ngZone.run(() => {
      this.cupons = this.cupons;
    });
  }

  async excluirCupom(id: Number) {
    const { error } = await supabase
      .from('cupons')
      .delete()
      .eq('id', Number(id))
      .maybeSingle();

    if (!error) {
      await this.carregarDados();
    }
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