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
  filiais: any[] = [];
  usuario: any[] = [];
  rankingGastos: any[] = [];
  rankingExtrapolo: any[] = [];
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
   logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  async ngOnInit() {
    this.filialId = this.auth.getFilialId();
    await this.carregarColaboradores()
    await this.carregarDados();
  }

   async carregarColaboradores() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, name');

    if (!error && data) {
      this.usuario = data;
    }
  }
  onFilialChange() {
    console.log('Filial selecionada:', this.filialSelecionada);
  }

  onColaboradorChange() {
    console.log('Colaborador selecionado:', this.colaboradorSelecionado);
  }

  async carregarDados() {
  const filtro = this.filialSelecionada || this.filialId;

  let query = this.supabase
    .from('cupons_com_usuario') // ← agora usa a view
    .select('*');

  if (filtro) {
    query = query.eq('filial_id', filtro);
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

    // Se veio um link completo do Supabase, extrai só o path a partir do bucket
    if (filePath.startsWith('http')) {
      // Pega tudo depois de "/cupons/" (preservando subpastas)
      const match = filePath.match(/cupons\/(.+)$/);
      if (match) {
        filePath = match[1];
      }
    }

    // Gera a URL pública correta
    const { data: pu } = this.supabase.storage
      .from('cupons')
      .getPublicUrl(filePath);

    publicUrl = pu?.publicUrl || '';

    // Adiciona timestamp para evitar cache
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
      status: c.status,
      diferenca,
      exceDeficit,
      descontar: c.descontar ?? true
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
      this.totalOrcamento += this.getValorBase(cupom.tipo || 0)

      const excedente = cupom.diferenca || 0;

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

      if (cupom.diferenca > 0) {
        excedentePorUsuario[nome] = (excedentePorUsuario[nome] || 0) + cupom.diferenca;
      }
    }

    this.rankingGastos = Object.entries(gastosPorUsuario)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    this.rankingExtrapolo = Object.entries(excedentePorUsuario) 
      .map(([nome, diferenca]) => ({ nome, diferenca }))
      .sort((a, b) => b.diferenca - a.diferenca)
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