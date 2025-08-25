import { Router } from '@angular/router';
import { CommonModule, NgFor } from '@angular/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { FormsModule } from '@angular/forms';
import { Component, HostListener } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { SharedModule } from '../../shared/shared.module';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

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
  tooltipOpenId: string | null = null;

  solicitacoesPendentes: Solicitacoes[] = [];
  solicitacoesAprovados: Solicitacoes[] = [];
  solicitacoesReprovados: Solicitacoes[] = [];
  solicitacoes: any[] = [];

  constructor(private auth: AuthService, private router: Router) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async ngOnInit() {
    this.filialId = this.auth.getFilialId();
    await this.carregarDados();
  }

  async carregarDados() {
    const filtro = this.filialSelecionada || this.filialId;

    let query = this.supabase
      .from('solicitacao')
      .select('id, profile_id, tipo_recarga, status, valor, data_solicitacao, observacoes, profiles (name), filiais (nome)');

    if (filtro) {
      query = query.eq('filial_id', filtro);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar cupons:', error.message);
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
  exportarParaExcel() {
    const exportData = this.solicitacoes.map(solicitacoes => ({
    ID: solicitacoes.id,
    Colaborador: solicitacoes.usuario,
    Filial: solicitacoes.filial,
    Data: solicitacoes.data,
    Tipo: solicitacoes.tipo,
    Valor: solicitacoes.valor,
    Status: solicitacoes.status,
    Observacoes: solicitacoes.observacoes,
    }));
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const workbook: XLSX.WorkBook = { Sheets: { 'Cupons': worksheet }, SheetNames: ['Cupons'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
      const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(data, 'relatorio_aprovações.xlsx');
  }
}