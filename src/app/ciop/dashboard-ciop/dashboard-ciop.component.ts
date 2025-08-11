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
    //SidebarCiopComponent,
    CommonModule,
    NgFor,
    RouterModule,
    FormsModule,
    SharedModule
  ]
})
export class DashboardCiopComponent implements OnInit {
  supabase: SupabaseClient;
  cupons: any[] = [];
  filialId: string | null = null;
  filiais: any[] = [];
  usuario: any[] = [];
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
  rankingGastos: any[] = [];
  rankingExtrapolo: any[] = [];

  async ngOnInit() {
    this.filialId = this.auth.getFilialId(); // ou null para ver todas
    await this.carregarFiliais();
    await this.carregarColaboradores()
    await this.carregarDados();
  }
  usarDadosTeste() {
  this.cupons = [
    {
      id: 1,
      usuario: 'Pedro',
      data: new Date().toISOString(),
      tipo: 'Almoço',
      valor: 75,
      orcamento_base: 35,
      excedente: 40,
      descontar: true,
      status: 'Aprovado',
      url_imagem: 'https://via.placeholder.com/100',
      filial_id: 'test-filial',
    },
    {
      id: 2,
      usuario: 'Joao',
      data: new Date().toISOString(),
      tipo: 'Janta',
      valor: 90,
      orcamento_base: 35,
      excedente: 55,
      descontar: true,
      status: 'Aprovado',
      url_imagem: 'https://via.placeholder.com/100',
      filial_id: 'test-filial',
    },
    {
      id: 3,
      usuario: 'Andrezin',
      data: new Date().toISOString(),
      tipo: 'Café da Manhã',
      valor: 20,
      orcamento_base: 15,
      excedente: 5,
      descontar: true,
      status: 'Aprovado',
      url_imagem: 'https://via.placeholder.com/100',
      filial_id: 'test-filial',
    },
    {
      id: 4,
      usuario: 'Edilso',
      data: new Date().toISOString(),
      tipo: 'Hospedagem',
      valor: 150,
      orcamento_base: 130,
      excedente: 20,
      descontar: true,
      status: 'Aprovado',
      url_imagem: 'https://via.placeholder.com/100',
      filial_id: 'test-filial',
    },
    {
      id: 5,
      usuario: 'Sid',
      data: new Date().toISOString(),
      tipo: 'Almoço',
      valor: 50,
      orcamento_base: 35,
      excedente: 15,
      descontar: true,
      status: 'Reprovado',
      url_imagem: 'https://via.placeholder.com/100',
      filial_id: 'test-filial',
    },{
      id: 6,
      usuario: 'Cristiano Ronaldo',
      data: new Date().toISOString(),
      tipo: 'Almoço',
      valor: 60,
      orcamento_base: 35,
      excedente: 25,
      descontar: true,
      status: 'Reprovado',
      url_imagem: 'https://via.placeholder.com/100',
      filial_id: 'test-filial',
    },
  ];

  this.processarIndicadores();
  this.gerarRankings();
}

  async carregarFiliais() {
        const { data, error } = await this.supabase
      .from('filiais')
      .select('id, nome');

    if (!error && data) {
      this.filiais = data;
    }
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

    const query = this.supabase
      .from('cupons_com_excedente')
      .select('*');

    if (filtro) {
      query.eq('filial_id', filtro);
    }

    const { data, error } = await query;

    if (!error && data) {
      this.cupons = data;
      this.processarIndicadores();
      this.gerarRankings();
    }
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

    this.rankingGastos = Object.entries(gastosPorUsuario)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    this.rankingExtrapolo = Object.entries(excedentePorUsuario)
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