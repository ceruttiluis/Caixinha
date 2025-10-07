import { Router, NavigationEnd } from '@angular/router';
import { CommonModule, NgFor } from '@angular/common';
import { supabase } from '../../services/supabaseClient';
import { FormsModule } from '@angular/forms';
import { Component, HostListener } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { SharedModule } from '../../shared/shared.module';
import { SharedService } from '../../services/shared.service';
import { NgZone } from '@angular/core';
import { filter } from 'rxjs/operators';

type SolicitacoesStatus = 'PENDENTE' | 'APROVADO' | 'REPROVADO';

interface Solicitacoes {
  id: number;
  usuario: string;
  usuarioID: string;
  filial: string;
  data: Date;
  tipo: string;
  valor: number;
  status: SolicitacoesStatus;
  observacoes: string;
  aprovador: string;
}

@Component({
  selector: 'app-solicitacoes',
  templateUrl: './solicitacoes.component.html',
  styleUrls: ['./solicitacoes.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    NgFor,
    CommonModule,
    SidebarCiopComponent,
    SharedModule
  ]
})
export class SolicitacoesComponent {
  filialId: string | null | undefined = undefined;
  colaboradorId: string | null | undefined = undefined;
  profiles: any[] = [];
  filiais: any[] = [];
  tooltipOpenId: string | null = null;
  periodoSelecionado: string = '';
  dataInicio?: Date;
  dataFim?: Date;
  trimestreSelecionado: null | undefined;
  semestreSelecionado: null | undefined;
  mesSelecionado: null | undefined;

  solicitacoesPendentes: Solicitacoes[] = [];
  solicitacoesAprovados: Solicitacoes[] = [];
  solicitacoesReprovados: Solicitacoes[] = [];
  solicitacoes: any[] = [];

  constructor(
    private auth: AuthService,
    private router: Router,
    private sharedService: SharedService,
    private ngZone: NgZone
  ) {
  }

  async ngOnInit() {
    await this.carregarDados();
    await this.carregarUsuarios();
    await this.carregarFiliais();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.carregarDados();
        this.carregarUsuarios();
        this.carregarFiliais();
      });
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
  async aplicarFiltros() {
    const { startDate, endDate } = this.sharedService.calcularPeriodo(
      this.periodoSelecionado,
      this.dataInicio,
      this.dataFim,
      this.mesSelecionado,
      this.trimestreSelecionado,
      this.semestreSelecionado,
    );
    this.carregarDados(startDate, endDate);
    this.separarListas();
  }

  async carregarDados(startDate?: Date, endDate?: Date) {

    let query = supabase
      .from('recarga')
      .select(`id, 
        profile_id, 
        tipo_recarga, 
        status_final, 
        valor, 
        data_solicitacao, 
        observacoes, 
        usuario:profiles!solicitacao_profile_id_fkey ( name ),
        filiais (nome),
        aprovador:profiles!recarga_aprovado_por_fkey ( name )
        `)
        .eq('status', 'APROVADO');

    if (this.filialId) {
      query = query.eq('filial_id', this.filialId);
    }
    if (this.colaboradorId) {
      query = query.eq('profile_id', this.colaboradorId);
    }
    if (startDate) {
      query = query.gte('data_solicitacao', new Date(startDate).toISOString().split('T')[0]);
    }
    if (endDate) {
      query = query.lte('data_solicitacao', new Date(endDate).toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar solicitacoes:', error.message);
      return;
    }

    this.solicitacoes = (data || []).map((s: any) => {

      return {
        id: s.id,
        usuarioID: s.profile_id,
        usuario: s.usuario?.name ?? '-',
        filial: s.filiais?.nome,
        tipo: s.tipo_recarga,
        status: s.status_final,
        valor: s.valor,
        data: s.data_solicitacao,
        observacoes: s.observacoes,
        aprovador: s.aprovador?.name ?? '-',
      };
    });
    this.ngZone.run(() => {
      this.solicitacoes = this.solicitacoes;
      this.separarListas();
    });
  }
  separarListas() {
    this.solicitacoesPendentes = this.solicitacoes.filter(s => s.status === 'PENDENTE');
    this.solicitacoesAprovados = this.solicitacoes.filter(s => s.status === 'APROVADO');
    this.solicitacoesReprovados = this.solicitacoes.filter(s => s.status === 'DESCONTADO');
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
  exportarExcelSolicitacoes() {
    console.log('Exportando solicitacoes:', this.solicitacoes);
    this.sharedService.exportarExcelRecargas(this.solicitacoes, 'solicitacoes.xlsx')
  }
}