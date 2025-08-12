import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule, NgFor,} from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-gerente',
  templateUrl: './dashboard-gerente.component.html',
  styleUrls: ['./dashboard-gerente.component.scss'],
  standalone: true,
  imports: [
        CommonModule,
        NgFor,
        RouterModule,
        FormsModule,
        SharedModule,
  ]
})
export class DashboardGerenteComponent implements OnInit {
  supabase: SupabaseClient;
  cupons: any[] = [];
  filialId: string | null = null;
  filiais: any[] = [];
  usuario: any[] = [];
  rankingGastosFilial: any[] = [];
  rankingExtrapoloFilial: any[] = [];
  filialSelecionada: string = '';
  colaboradorSelecionado: string = '';

  totalGasto = 0;
  totalOrcamento = 0;
  totalDeficit = 0;
  totalDescontado = 0;
  totalExcedenteAprovado = 0;

  constructor(private auth: AuthService, private router: Router) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async ngOnInit() {
    this.filialId = this.auth.getFilialId() 

    const { data, error } = await this.supabase
      .from('cupons_com_excedente')
      .select('*')
      .eq('filial_id', this.filialId);

    if (!error) this.cupons = data || [];
     return this.filialId;
  }

  async updateStatusFilial(id: number, status: string) {
    await this.supabase
      .from('cupons')
      .update({ status })
      .eq('id', id);

    await this.ngOnInit(); // refresh
  }
  async carregarColaboradores() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, name');

    if (!error && data) {
      this.usuario = data;
    }
  }
    onColaboradorChange() {
    console.log('Colaborador selecionado:', this.colaboradorSelecionado);
  }
  async carregarDados() {
  const filtro = this.filialSelecionada || this.filialId;
  const valorPolitica = 35; 

  let query = this.supabase
    .from('cupons')
    .select(`
      id,
      valor,
      tipo_gasto,
      data_nota,
      status,
      url_imagem,
      filial_id,
      usuario:profiles(name) 
    `);

  if (filtro) {
    query = query.eq('filial_id', filtro);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar cupons:', error.message);
    return;
  }

   this.cupons = (data || []).map((c: any) => {
    const usuarioNome =
      (c.usuario && (c.usuario.nome || c.usuario.name)) ||
      c.usuario_name ||
      '';

    const valorBase = this.getValorBase(c.tipo_gasto || c.tipo);
    const excedente = Number((c.valor - valorBase).toFixed(2)); 

    let publicUrl = '';
    if (c.url_imagem) {
      const { data: pu } = this.supabase.storage
        .from('cupons')
        .getPublicUrl(c.url_imagem);
      publicUrl = pu?.publicUrl || c.url_imagem;
    }

    return {
      id: c.id,
      usuario: usuarioNome?.name,
      data: c.data_nota || c.data,
      tipo: c.tipo_gasto || c.tipo,
      valor: c.valor,
      url_imagem: publicUrl,
      status: c.status,
      excedente,
      descontar: c.descontar ?? false
    };
  });

  this.processarIndicadores();
  this.gerarRankings();
}
getValorBase(tipo: string) {
  const valores: Record<string, number> = {
    'Almoço': 35,
    'Janta': 35,
    'Cafe da Manhã': 15,
    'Hospedagem': 130,
  };
  return valores[tipo] ?? 0;
}

  processarIndicadores() {
    this.totalGasto = 0;
    this.totalOrcamento = 0;
    this.totalDeficit = 0;
    this.totalDescontado = 0;
    this.totalExcedenteAprovado = 0;

    for (const cupom of this.cupons) {
      this.totalGasto += cupom.valor;
      this.totalOrcamento += cupom.orcamento_base || 0;

      const excedente = cupom.excedente || 0;

      if (excedente > 0) {
        this.totalDeficit += excedente;

        if (cupom.descontar) {
          this.totalDescontado += excedente;
        } else {
          this.totalExcedenteAprovado += excedente;
        }
      }
    }
  }

  gerarRankings() {
    const gastosPorUsuario: Record<string, number> = {};
    const excedentePorUsuario: Record<string, number> = {};

    for (const cupom of this.cupons) {
      const nome = cupom.usuario;
      const filial = cupom.filial_id;
      gastosPorUsuario[nome] = (gastosPorUsuario[nome] || 0) + cupom.valor;

      if (cupom.excedente > 0) {
        excedentePorUsuario[nome] = (excedentePorUsuario[nome] || 0) + cupom.excedente;
      }
    }

    this.rankingGastosFilial = Object.entries(gastosPorUsuario)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    this.rankingExtrapoloFilial = Object.entries(excedentePorUsuario)
      .map(([nome, excedente]) => ({ nome, excedente }))
      .sort((a, b) => b.excedente - a.excedente)
      .slice(0, 5);
  }

  async updateStatus(id: number, status: string) {
    await this.supabase
      .from('cupons')
      .update({ status })
      .eq('id', id);

    await this.carregarDados(); // refresh
  }
  
  exportarParaExcel() {
    const exportData = this.cupons.map(cupom => ({
      Colaborador: cupom.usuario_nome,
      Tipo: cupom.tipo_gasto,
      Valor: cupom.valor,
      Excedente: cupom.excedente,
      Status: cupom.status,
      Data: cupom.data_nota
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'Cupons': worksheet }, SheetNames: ['Cupons'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, 'relatorio_cupons.xlsx');
  }
}
