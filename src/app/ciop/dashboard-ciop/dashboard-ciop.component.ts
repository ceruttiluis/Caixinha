import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule, NgFor,} from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { RouterModule, Router } from '@angular/router';
import { url } from 'inspector';

@Component({
  selector: 'app-dashboard-ciop',
  templateUrl: './dashboard-ciop.component.html',
  styleUrls: ['./dashboard-ciop.component.scss'],
  standalone: true,
  imports: [
    SidebarCiopComponent,
    CommonModule,
    NgFor,
    RouterModule,
    FormsModule,
    SharedModule,
]
})
export class DashboardCiopComponent implements OnInit {
  supabase: SupabaseClient;
  cupons: any[] = [];
  filialId: string | null = null;
  usuario: any[] = [];
  profiles: any[] = [];
  filiais: any[] = [];
  rankingGastos: any[] = [];
  rankingExtrapolo: any[] = [];
  filialSelecionada: string = '';
  colaboradorSelecionado: string | null = null;

  totalGasto = 0;
  totalOrcamento = 0;
  totalDeficit = 0;
  totalDescontado = 0;
  totalExcedenteAprovado = 0;

  constructor(private auth: AuthService, private router: Router) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }
   logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  async ngOnInit() {
    await this.carregarDados();
    await this.carregarProfiles();
    await this.carregarFiliais();
  }

  onFilialChange() {
    const filial = this.filiais.find(f => f.nome === this.filialSelecionada);
    this.filialId = filial ? filial.id : null;

    console.log("Selecionada:", this.filialSelecionada, "-> id:", this.filialId);
    console.log('Filial selecionada:', this.filialSelecionada);
    this.carregarProfiles();
    this.carregarDados();
  }

  onColaboradorChange() {
    const colaborador = this.profiles.find(c => c.nome === this.colaboradorSelecionado);
    this.colaboradorSelecionado = colaborador ? colaborador.id : null;
    console.log('Usuario selecionado:', this.colaboradorSelecionado);
    this.carregarDados();
  }

  async carregarDados() {

  let query = this.supabase
    .from('cupons_com_usuario')
    .select('*');

    if (this.filialSelecionada) {
      query = query.eq('filial_id', this.filialSelecionada);
    }
    if (this.colaboradorSelecionado) {
      query = query.eq('usuario_id', this.colaboradorSelecionado);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar cupons:', error.message);
      return;
    }

  this.cupons = (data || []).map((c: any) => {
    const valorBase = this.getValorBase(c.tipo_gasto);
    const diferenca = Number((c.valor - valorBase).toFixed(2));
    const exceDeficit = Number((valorBase - c.valor).toFixed(2));

    let publicUrl = '';

      if (c.url_imagem) {
        let filePath = c.url_imagem.trim();

        if (filePath.startsWith('http')) {
          const match = filePath.match(/cupons\/(.+)$/);
            if (match) {
              filePath = match[1];
            } 
        }
        const { data: pu } = this.supabase.storage
          .from('cupons')
          .getPublicUrl(filePath);

        publicUrl = pu?.publicUrl || '';

        if (publicUrl) {
          publicUrl += (publicUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
        }
      }
      return {
        id: c.id,
        usuario: c.usuario_nome,
        data: c.data_nota,
        tipo: c.tipo_gasto,
        valor: c.valor,
        url_imagem: publicUrl,
        imagem: c.url_imagem,
        status: c.status,
        filial: c.filial_nome,
        diferenca,
        exceDeficit,
        descontar: c.descontar
    };
  });

    this.processarIndicadores();
    this.gerarRankings();
  }
  getValorBase(tipo: string) {
    const valores: Record<string, number> = {
      'Almoço': 35,
      'Janta': 35,
      'Café da Manhã': 15,
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
      this.totalOrcamento += this.getValorBase(cupom.tipo || 0)

      const excedente = cupom.diferenca || 0;

      if (excedente > 0) {
        this.totalDeficit += excedente;

        if (cupom.status === 'DESCONTADO') {
          this.totalDescontado += excedente;
        } else if(cupom.status === 'APROVADO') {
          this.totalExcedenteAprovado += excedente;
        }
      }
    }
  }

  gerarRankings() {
    const gastosPorUsuario: Record<string, { total: number, filialNome: string }> = {};
    const excedentePorUsuario: Record<string, { diferenca: number, filialNome: string }> = {};

    for (const cupom of this.cupons) {
      const nome = cupom.usuario;
      const filial = cupom.filial_id;
      const filialNome = cupom.filial;

      if (!gastosPorUsuario[nome]) {
         gastosPorUsuario[nome] = { total: 0, filialNome };
      }
      gastosPorUsuario[nome].total += cupom.valor;

      if (cupom.diferenca > 0) {
        if (!excedentePorUsuario[nome]) {
          excedentePorUsuario[nome] = { diferenca: 0, filialNome };
        }
        excedentePorUsuario[nome].diferenca += cupom.diferenca;
      }
    }

    this.rankingGastos = Object.entries(gastosPorUsuario)    
      .map(([nome, dados ]) => ({ nome, total: dados.total, filial: dados.filialNome }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    this.rankingExtrapolo = Object.entries(excedentePorUsuario) 
      .map(([nome, dados]) => ({ nome, diferenca: dados.diferenca, filial: dados.filialNome }))
      .sort((a, b) => b.diferenca - a.diferenca)
      .slice(0, 5);
  }

  async updateStatus(id: number, status: string) {
    await this.supabase
      .from('cupons')
      .update({ status })
      .eq('id', id);

    await this.carregarDados(); 
  }

  async carregarProfiles() {
    let query = this.supabase
      .from('profiles')
      .select('*')
      if (this.filialSelecionada) {
        query = query.eq('filial_id', this.filialSelecionada);
      }

      const { data, error } = await await query;

      if (error) {
        console.error('Erro ao buscar usuarios:', error.message);
        return;
      }

      this.profiles = (data || []).map((p: any) => ({
        id: p.id,
        nome: p.name,
      }));
  }

  async carregarFiliais() {
    const { data, error } = await this.supabase
      .from('filiais')
      .select('*')
      .order('id', { ascending: false });

      if (error) {
        console.error('Erro ao buscar filiais:', error.message);
        return;
      }

      this.filiais = (data || []).map((f: any) => ({
        id: f.id,
        nome: f.nome,
      }));
  }

  exportarParaExcel() {
    const exportData = this.cupons.map(cupom => ({
      ID: cupom.id,
      Colaborador: cupom.usuario_nome,
      Data: cupom.data_nota,
      Tipo: cupom.tipo_gasto,
      Valor: cupom.valor,
      Excedente: cupom.excedente,
      Status: cupom.status
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'Cupons': worksheet }, SheetNames: ['Cupons'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, 'relatorio_cupons.xlsx');
  }
}