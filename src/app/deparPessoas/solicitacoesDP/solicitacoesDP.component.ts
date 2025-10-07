
import { CommonModule, NgFor } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { supabase } from '../../services/supabaseClient';
import { FormsModule } from '@angular/forms';
import { Component, HostListener, ChangeDetectorRef } from '@angular/core';
import { SidebarDPComponent } from '../sharedDP/sidebarDP.component';
import { SharedModule } from '../../shared/shared.module';
import { SharedService } from '../../services/shared.service';
import { filter } from 'rxjs/operators';
import { NgZone } from '@angular/core';

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
  selector: 'app-solicitacoes-dp',
  templateUrl: './solicitacoesDP.component.html',
  styleUrls: ['./solicitacoesDP.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    NgFor,
    CommonModule,
    SharedModule,
    SidebarDPComponent
  ]
})
export class SolicitacoesDPComponent {
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
  modalAberto = false;
  valorEditado: number = 0;
  solicitacaoSelecionada: Solicitacoes | null = null;
  mensagem: string = '';
  estadoMensagem: '' | 'loading' | 'sucesso' | 'erro' = '';

  solicitacoesPendentes: Solicitacoes[] = [];
  solicitacoesAprovados: Solicitacoes[] = [];
  solicitacoesReprovados: Solicitacoes[] = [];
  solicitacoes: any[] = [];

  constructor(
    private sharedService: SharedService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef) {
  }

  async ngOnInit() {
    await this.carregarDados();
    await this.carregarUsuarios();
    await this.carregarFiliais();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.carregarDados();
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
    this.solicitacoesReprovados = this.solicitacoes.filter(s => s.status === 'REPROVADO');
  }

  async atualizarStatusRH(solicitacoes: Solicitacoes, novoStatus: SolicitacoesStatus) {
    const { data, error } = await supabase
      .from('recarga')
      .update({ status_final: novoStatus })
      .eq('id', Number(solicitacoes.id))
      .select('*')
      .maybeSingle();

    if (error) {
      console.error(`Erro ao atualizar solicitacao #${solicitacoes.id}:`, error.message);
      this.mostrarMensagem('Erro ao atualizar solicitacao:', 'erro');
      return;
    }
    if (!data) {
      console.warn(`Nenhuma solicitacao encontrado ou permitido para atualização: #${solicitacoes.id}`);
      return;
    }

    if (novoStatus === 'APROVADO') {
      const usuarioId = solicitacoes.usuarioID;

      const { data: usuario, error: usuarioError } = await supabase
        .from('profiles')
        .select('carteira, filial_id, name')
        .eq('id', usuarioId)
        .maybeSingle();

      if (usuarioError || !usuario) {
        console.error(`Usuário não encontrado: ${usuarioId}`);

        return;
      }

      const novoSaldo = (usuario.carteira || 0) + (solicitacoes.valor || 0);

      const { error: updateError } = await supabase
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

      const { error: insertError } = await supabase
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

    this.ngZone.run(() => {
      this.solicitacoes = this.solicitacoes;
      this.separarListas();
    });
  }

  async reprovarValor(solicitacoes: Solicitacoes, novoStatus: SolicitacoesStatus){
    const { data, error } = await supabase
      .from('recarga')
      .update({ status_final: novoStatus })
      .eq('id', Number(solicitacoes.id))
      .select('*')
      .maybeSingle();

    if (error) {
      console.error(`Erro ao atualizar solicitacao #${solicitacoes.id}:`, error.message);
      this.mostrarMensagem('Erro ao atualizar solicitacao:', 'erro');
      return;
    }
    if (!data) {
      console.warn(`Nenhuma solicitacao encontrado ou permitido para atualização: #${solicitacoes.id}`);
      return;
    }

    if (novoStatus === 'REPROVADO') {
      const usuarioId = solicitacoes.usuarioID;

      const { data: usuario, error: usuarioError } = await supabase
        .from('profiles')
        .select('carteira, filial_id, name')
        .eq('id', usuarioId)
        .maybeSingle();

      if (usuarioError || !usuario) {
        console.error(`Usuário não encontrado: ${usuarioId}`);

        return;
      }

      const novoSaldo = (usuario.carteira || 0) - (solicitacoes.valor || 0);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ carteira: novoSaldo })
        .eq('id', usuarioId);

      if (updateError) {
        console.error('Erro ao atualizar saldo: ' + updateError.message);
        return;
      }
    }

    this.solicitacoesPendentes = this.solicitacoesPendentes.filter(s => s.id !== solicitacoes.id);
    this.solicitacoesAprovados = this.solicitacoesAprovados.filter(s => s.id !== solicitacoes.id);
    this.solicitacoesReprovados = this.solicitacoesReprovados.filter(s => s.id !== solicitacoes.id);

    solicitacoes.status = novoStatus;
    if (novoStatus === 'APROVADO') this.solicitacoesAprovados.push(solicitacoes);
    else if (novoStatus === 'REPROVADO') this.solicitacoesReprovados.push(solicitacoes);
    else this.solicitacoesPendentes.push(solicitacoes);

    this.ngZone.run(() => {
      this.solicitacoes = this.solicitacoes;
      this.separarListas();
    });
  }

  async salvarEdicao() {
    if (!this.solicitacaoSelecionada) return;

    this.estadoMensagem = 'loading';
    this.mensagem = 'Atualizando valor...';

    try {
      const { data, error } = await supabase
        .from('recarga')
        .update({ valor: this.valorEditado })
        .eq('id', this.solicitacaoSelecionada.id)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Erro ao editar valor:', error.message);
        this.mostrarMensagem('Erro ao editar valor!', 'erro');
        this.fecharModal();
        return;
      }

      if (data) {
        this.solicitacaoSelecionada.valor = this.valorEditado;
        this.estadoMensagem = '';
        this.mensagem = '';
        this.cdr.detectChanges();
        this.mostrarMensagem('Valor atualizado com sucesso!', 'sucesso');
        this.fecharModal();
      }
    } catch (error) {
      console.error('Erro ao editar valor:', error);
      this.mostrarMensagem('Erro ao editar valor!', 'erro');
      this.fecharModal();
    } finally {
      this.cdr.detectChanges();
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
  exportarExcelSolicitacoes() {
    console.log('Exportando solicitacoes:', this.solicitacoes);
    this.sharedService.exportarExcelRecargas(this.solicitacoes, 'solicitacoes.xlsx')
  }
  abrirModalEditar(solicitacao: Solicitacoes) {
    this.solicitacaoSelecionada = solicitacao;
    this.valorEditado = solicitacao.valor;
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
    this.solicitacaoSelecionada = null;
  }
  mostrarMensagem(texto: string, tipo: 'sucesso' | 'erro') {
    this.mensagem = texto;
    this.estadoMensagem = tipo;

    setTimeout(() => {
      this.estadoMensagem = '';
      this.mensagem = '';
      this.cdr.detectChanges();
    }, 3000);
  }
}