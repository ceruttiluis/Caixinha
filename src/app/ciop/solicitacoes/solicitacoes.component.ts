import { Router } from '@angular/router';
import { CommonModule, NgFor } from '@angular/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { FormsModule } from '@angular/forms';
import { Component, HostListener } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { SharedModule } from '../../shared/shared.module';
import { environment } from '../../../environments/environment';
import { SharedService } from '../../shared/shared.service';

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
  supabase: SupabaseClient;
  filialId: string | null = null;
  filialSelecionada: string = '';
  colaboradorSelecionado?: string;
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

  constructor(private auth: AuthService, private router: Router, private sharedService: SharedService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async ngOnInit() {
    await this.carregarDados();
    await this.carregarUsuarios();
    await this.carregarFiliais();
  }

  onFilialChange() {
    console.log('Filial selecionada:', this.filialSelecionada);
    this.carregarUsuarios();
    this.carregarDados();
  }
  async carregarFiliais() {
    this.filiais = await this.sharedService.carregarFiliais();
  }

  onColaboradorChange() {
    console.log('Usuário selecionado:', this.colaboradorSelecionado);
    this.carregarDados();
  }
  async carregarUsuarios() {
    this.profiles = await this.sharedService.carregarProfiles(
      this.filialSelecionada || this.filialId
    );
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

    let query = this.supabase
      .from('solicitacao')
      .select('id, profile_id, tipo_recarga, status, valor, data_solicitacao, observacoes, profiles (name), filiais (nome)');

    if (this.filialSelecionada) {
      query = query.eq('filial_id', this.filialSelecionada);
    }
    if (this.colaboradorSelecionado) {
      query = query.eq('profile_id', this.colaboradorSelecionado);
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
        usuario: s.profiles?.name,
        filial: s.filiais?.nome,
        tipo: s.tipo_recarga,
        status: s.status,
        valor: s.valor,
        data: s.data_solicitacao,
        observacoes: s.observacoes,
      };
    });
    this.separarListas();
  }
  separarListas() {
    this.solicitacoesPendentes = this.solicitacoes.filter(s => s.status === 'PENDENTE');
    this.solicitacoesAprovados = this.solicitacoes.filter(s => s.status === 'APROVADO');
    this.solicitacoesReprovados = this.solicitacoes.filter(s => s.status === 'DESCONTADO');
  }

  async atualizarStatusCupom(solicitacoes: Solicitacoes, novoStatus: SolicitacoesStatus) {
    const { data, error } = await this.supabase
      .from('solicitacao')
      .update({ status: novoStatus })
      .eq('id', Number(solicitacoes.id))
      .select('*')
      .maybeSingle();

    if (error) {
      console.error(`Erro ao atualizar cupom #${solicitacoes.id}:`, error.message);
      return;
    }
    if (!data) {
      console.warn(`Nenhuma solicitacao encontrado ou permitido para atualização: #${solicitacoes.id}`);
      return;
    }

    if (novoStatus === 'APROVADO') {
      const usuarioId = solicitacoes.usuarioID;

      const { data: usuario, error: usuarioError } = await this.supabase
        .from('profiles')
        .select('carteira, filial_id, name')
        .eq('id', usuarioId)
        .maybeSingle();

      if (usuarioError || !usuario) {
        console.error(`Usuário não encontrado: ${usuarioId}`);
        return;
      }

      const novoSaldo = (usuario.carteira || 0) + (solicitacoes.valor || 0);

      const { error: updateError } = await this.supabase
        .from('profiles')
        .update({ carteira: novoSaldo })
        .eq('id', usuarioId);

      if (updateError) {
        console.error('Erro ao atualizar saldo: ' + updateError.message);
        return;
      }
      const historicoData = {
        profile_id: usuarioId,
        filial_id: usuario.filial_id,
        observacoes: solicitacoes.observacoes || 'Recarga aprovada',
        valor_add: solicitacoes.valor,
        criado_em: new Date().toISOString(),
        tipo_recarga: solicitacoes.tipo,
      };

      const { error: insertError } = await this.supabase
        .from('carteira')
        .insert(historicoData);

      if (insertError) {
        console.error('Erro ao registrar histórico: ' + insertError.message);
      }
    }

    this.solicitacoesPendentes = this.solicitacoesPendentes.filter(s => s.id !== solicitacoes.id);
    this.solicitacoesAprovados = this.solicitacoesAprovados.filter(s => s.id !== solicitacoes.id);
    this.solicitacoesReprovados = this.solicitacoesReprovados.filter(s => s.id !== solicitacoes.id);

    solicitacoes.status = novoStatus;
    if (novoStatus === 'APROVADO') this.solicitacoesAprovados.push(solicitacoes);
    else if (novoStatus === 'REPROVADO') this.solicitacoesReprovados.push(solicitacoes);
    else this.solicitacoesPendentes.push(solicitacoes);
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