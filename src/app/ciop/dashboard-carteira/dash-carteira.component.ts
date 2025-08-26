import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { SharedModule } from '../../shared/shared.module';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';

interface Adicao {
  data: string;
  usuario: string;
  valor: number;
  observacao: string;
}

interface User {
  data: string;
  usuario: string;
  descricao: string;
  valor: number;
}

@Component({
  selector: 'app-dash-carteira',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SidebarCiopComponent,
    SharedModule,
    NgChartsModule],
  templateUrl: './dash-carteira.component.html',
  styleUrls: ['./dash-carteira.component.scss']
})

export class DashCarteiraComponent implements OnInit {
  @ViewChild('gastosChart') gastosChart: BaseChartDirective | undefined;
  @ViewChild('adicoesChart') adicoesChart: BaseChartDirective | undefined;
  supabase: SupabaseClient;
  cupons: any[] = [];
  adicoes: any[] = [];
  carteira: any[] = [];
  users: User[] = [];
  filiais: any[] = [];
  filialId: string | null = null;
  filialSelecionada: string = '';
  colaboradorSelecionado: string | null = null;
  saldoTotal = 0;
  totalAdicoes = 0;
  totalGasto = 0;
  saldoAtual = 0;
  extra = 0;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async ngOnInit() {
    this.carregarDados();
    this.carregarAdicoes();
    this.carregarCarteira();
  }
  onFilialChange() {
    const filial = this.filiais.find(f => f.nome === this.filialSelecionada);
    this.filialId = filial ? filial.id : null;

    console.log("Selecionada:", this.filialSelecionada, "-> id:", this.filialId);
    console.log('Filial selecionada:', this.filialSelecionada);
    this.carregarDados();
  }

  async carregarDados() {
    const filtro = this.filialSelecionada || this.filialId;

    let query = this.supabase
      .from('cupons_com_usuario')
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

      return {
        usuario: c.usuario_nome,
        data: c.data_nota,
        tipo: c.tipo_gasto,
        valor: c.valor,
      };
    });
    this.processarIndicadores();
  }

  async carregarAdicoes() {
    const filtro = this.filialSelecionada || this.filialId;

    let query = this.supabase
      .from('carteira')
      .select('profile_id, criado_em, observacoes, tipo_recarga,  valor_add, profiles (name)');

    if (filtro) {
      query = query.eq('filial_id', filtro);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar adicoes:', error.message);
      return;
    }

    this.adicoes = (data || []).map((a: any) => {

      return {
        usuario: a.profiles?.name || 'Sem nome',
        data: a.criado_em,
        tipo: a.tipo_recarga,
        observacao: a.observacoes,
        valor: a.valor_add,
      };
    });
    this.processarIndicadores();
  }

  async carregarCarteira() {
    const filtro = this.filialSelecionada || this.filialId;

    let query = this.supabase
      .from('profiles')
      .select('*');

    if (filtro) {
      query = query.eq('filial_id', filtro);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar adicoes:', error.message);
      return;
    }

    this.carteira = (data || []).map((ca: any) => {

      return {
        valor: ca.carteira,
      };
    });
    this.processarIndicadores();
  }
  processarIndicadores() {
    this.totalGasto = 0;
    this.totalAdicoes = 0;
    this.saldoTotal = 0;
    this.extra = 0;

    this.barChartGastos.labels = [];
    this.barChartAdicoes.labels = [];
    this.barChartGastos.datasets[0].data = [];
    this.barChartAdicoes.datasets[0].data = [];

    for (const carteira of this.carteira) {
      this.saldoTotal += carteira.valor;
    }
    const gastosPorTipo: { [key: string]: number } = {
      'Almoço': 0,
      'Janta': 0,
      'Café da Manhã': 0,
      'Hospedagem': 0
    };
    for (const cupom of this.cupons) {
      this.totalGasto += cupom.valor;

      if (gastosPorTipo.hasOwnProperty(cupom.tipo)) {
        gastosPorTipo[cupom.tipo] += cupom.valor;
      }
    }
    for (const tipo in gastosPorTipo) {
      if (gastosPorTipo[tipo] > 0) {
        this.barChartGastos.labels!.push(tipo);
        (this.barChartGastos.datasets[0].data as number[]).push(gastosPorTipo[tipo]);
      }
    }
    const adicoesPorCategoria: { [key: string]: number } = {
      'Recarga Mensal': 0,
      'Extra': 0
    };
    for (const adicao of this.adicoes) {
      this.totalAdicoes += adicao.valor;

      if (adicao.tipo === 'Recarga Extra' || adicao.tipo === 'Extra') {
        adicoesPorCategoria['Extra'] += adicao.valor;
        this.extra += adicao.valor;
      } else if (adicao.tipo === 'Recarga Mensal') {
        adicoesPorCategoria['Recarga Mensal'] += adicao.valor;
      }
    }
    for (const categoria in adicoesPorCategoria) {
      if (adicoesPorCategoria[categoria] > 0) {
        this.barChartAdicoes.labels!.push(categoria);
        (this.barChartAdicoes.datasets[0].data as number[]).push(adicoesPorCategoria[categoria]);
      }
    }

    this.saldoAtual = this.saldoTotal - this.totalGasto;
    this.atualizarGraficos();
  }
  atualizarGraficos() {
    setTimeout(() => {
      if (this.gastosChart) {
        this.gastosChart.update();
      }
      if (this.adicoesChart) {
        this.adicoesChart.update();
      }
    }, 0);
  }
  public barChartGastos: ChartConfiguration<'bar'>['data'] = {
    labels: [] as string[],
    datasets: [
      {
        label: 'Gastos',
        data: [] as number[],
        backgroundColor: '#e74c3c'
      },
    ]
  };
  public barChartAdicoes: ChartConfiguration<'bar'>['data'] = {
    labels: [] as string[],
    datasets: [
      {
        label: 'Adições',
        data: [] as number[],
        backgroundColor: '#2ecc71'
      }
    ]
  };

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `R$ ${ctx.formattedValue}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `R$ ${value}`
        }
      }
    }
  };
}
