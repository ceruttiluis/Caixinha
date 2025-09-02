import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule, NgFor, } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { RouterModule, Router } from '@angular/router';
import { SidebarColaboradorComponent } from '../shared-colaborador/sidebar.component';
import { SharedService } from '../../shared/shared.service';

@Component({
  selector: 'app-dash-colaborador',
  templateUrl: './dash-colaborador.component.html',
  styleUrls: ['./dash-colaborador.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    RouterModule,
    FormsModule,
    SharedModule,
    SidebarColaboradorComponent
  ]
})
export class DashColaboradorComponent implements OnInit {
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

  constructor(private auth: AuthService, private router: Router, private sharedService: SharedService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }
  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  async ngOnInit() {
    this.filialId = this.auth.getFilialId();
    await this.carregarFiliais();
    await this.carregarColaboradores()
    await this.carregarDados();
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
    try {
      this.cupons = await this.sharedService.carregarCuponsColaborador();

      console.log('Cupons carregados:', this.cupons);
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
    }
    this.processarIndicadoresColaborador();
  }
  processarIndicadoresColaborador() {
    const indicadores = this.sharedService.processarIndicadores(this.cupons);
    this.totalGasto = indicadores.totalGasto;
    this.totalOrcamento = indicadores.totalOrcamento;
    this.totalDeficit = indicadores.totalDeficit;
    this.totalDescontado = indicadores.totalDescontado;
    this.totalExcedenteAprovado = indicadores.totalExcedenteAprovado;

    const rankings = this.sharedService.gerarRankings(this.cupons);
    this.rankingGastos = rankings.rankingGastos;
    this.rankingExtrapolo = rankings.rankingExtrapolo;
  }

  async updateStatus(id: number, status: string) {
    await this.supabase
      .from('cupons')
      .update({ status })
      .eq('id', id);

    await this.carregarDados();
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