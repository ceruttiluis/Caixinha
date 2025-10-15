import { Component, ViewChild, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ChartConfiguration } from 'chart.js';
import { CommonModule } from '@angular/common';
import { supabase } from '../../services/supabaseClient';
import { FormsModule } from '@angular/forms';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { SharedModule } from '../../shared/shared.module';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { SharedService } from '../../services/shared.service';
import { CupomService } from '../../services/cupom.service';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgZone } from '@angular/core';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-dash-carteira',
  templateUrl: './dash-carteira.component.html',
  styleUrls: ['./dash-carteira.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarCiopComponent,
    SharedModule,
    NgChartsModule]
})

export class DashCarteiraComponent implements OnInit {
  @ViewChild('gastosChart') gastosChart: BaseChartDirective | undefined;
  @ViewChild('adicoesChart') adicoesChart: BaseChartDirective | undefined;
  cupons: any[] = [];
  adicoes: any[] = [];
  carteira: any[] = [];
  filiais: any[] = [];
  profiles: any[] = [];
  filialId: string | null | undefined = undefined;
  colaboradorId: string | null | undefined = undefined;
  periodoSelecionado: string = '';
  dataInicio?: Date;
  dataFim?: Date;
  startDate?: Date;
  endDate?: Date;
  trimestreSelecionado: null = null;
  semestreSelecionado: null = null;
  mesSelecionado: null = null;
  saldoTotal = 0;
  totalAdicoes = 0;
  totalGasto = 0;
  saldoAtual = 0;
  extra = 0;
  isBrowser: boolean;

  constructor(
    private auth: AuthService,
    private router: Router,
    private sharedService: SharedService,
    private ngZone: NgZone,
    private cupomService: CupomService,
    @Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngOnInit() {
    await this.carregarTodosOsDados()
    await this.carregarUsuarios();
    await this.carregarFiliais();
    await this.carregarComFiltros();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.carregarTodosOsDados();
        this.carregarUsuarios();
        this.carregarFiliais();
        this.carregarComFiltros();
      });
  }
  async carregarTodosOsDados() {
    await this.carregarDados();
    await this.carregarAdicoes();
    await this.carregarCarteira();
  }
  onFilialChange() {
    console.log('Filial selecionada:', this.filialId);
    this.carregarUsuarios();
    this.carregarTodosOsDados()
  }
  async carregarFiliais() {
    this.filiais = await this.sharedService.carregarFiliais();
    this.ngZone.run(() => {
      this.filiais = this.filiais;
    });
  }

  onColaboradorChange() {
    console.log('Usuário selecionado:', this.colaboradorId);
    this.carregarTodosOsDados()
  }
  async carregarUsuarios() {
    this.profiles = await this.sharedService.carregarProfiles(
      this.filialId
    );
    this.ngZone.run(() => {
      this.profiles = this.profiles;
    });
  }
  async carregarComFiltros(filialId?: string, colaboradorId?: string) {
    this.cupons = await this.cupomService.carregarCuponsCiop(
      filialId,
      colaboradorId
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
    this.startDate = startDate;
    this.endDate = endDate;
    await this.carregarTodosOsDados();
    await this.processarIndicadores();

  }
  async carregarDados(
    dataInicio?: Date,
    dataFim?: Date
  ) {
    try {
      let startDate = dataInicio ?? this.startDate;
      let endDate = dataFim ?? this.endDate;
      this.cupons = await this.cupomService.carregarCuponsCiop(
        this.filialId,
        this.colaboradorId,
        startDate,
        endDate
      );
    } catch (error) {
      console.error('Erro ao carregar cupons do gerente:', error);
    }
    this.ngZone.run(() => {
      this.cupons = this.cupons;
      this.processarIndicadores();
    });
  }

  async carregarAdicoes() {
    let query = supabase
      .from('carteira')
      .select(`profile_id, 
        criado_em, 
        observacoes, 
        tipo_recarga,  
        valor_add, 
        profiles (name), 
        filiais (nome)`);

    if (this.filialId) {
      query = query.eq('filial_id', this.filialId);
    }
    if (this.colaboradorId) {
      query = query.eq('profile_id', this.colaboradorId);
    }
    if (this.startDate) {
      query = query.gte('criado_em', new Date(this.startDate).toISOString().split('T')[0]);
    }
    if (this.endDate) {
      query = query.lte('criado_em', new Date(this.endDate).toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar adicoes:', error.message);
      return;
    }

    this.adicoes = (data || []).map((a: any) => {

      return {
        usuario: a.profiles?.name ?? '-',
        data: a.criado_em,
        tipo: a.tipo_recarga,
        observacao: a.observacoes,
        valor: a.valor_add,
        filial: a.filiais?.nome ?? '-',
      };
    });
    this.ngZone.run(() => {
      this.adicoes = this.adicoes;
      this.processarIndicadores();
    });
  }

  async carregarCarteira() {

    let query = supabase
      .from('profiles')
      .select('*');

    if (this.filialId) {
      query = query.eq('filial_id', this.filialId);
    }
    if (this.colaboradorId) {
      query = query.eq('id', this.colaboradorId);
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
    this.ngZone.run(() => {
      this.carteira = this.carteira;
      this.processarIndicadores();
    });
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
      'Hospedagem': 0,
      'Outros': 0
    };
    for (const cupom of this.cupons) {
      this.totalGasto += cupom.valor;

      if (gastosPorTipo.hasOwnProperty(cupom.tipo)) {
        gastosPorTipo[cupom.tipo] += cupom.valor;
      }
    }
    for (const tipo in gastosPorTipo) {
      if (gastosPorTipo[tipo] > 0) {
        this.barChartGastos = {
          labels: Object.keys(gastosPorTipo).filter(tipo => gastosPorTipo[tipo] > 0),
          datasets: [
            {
              label: 'Gastos',
              data: Object.keys(gastosPorTipo).filter(tipo => gastosPorTipo[tipo] > 0).map(tipo => gastosPorTipo[tipo]),
              backgroundColor: '#e74c3c'
            }
          ]
        };
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
        this.barChartAdicoes = {
          labels: Object.keys(adicoesPorCategoria).filter(categoria => adicoesPorCategoria[categoria] > 0),
          datasets: [
            {
              label: 'Adições',
              data: Object.keys(adicoesPorCategoria).filter(categoria => adicoesPorCategoria[categoria] > 0).map(categoria => adicoesPorCategoria[categoria]),
              backgroundColor: '#2ecc71'
            }
          ]
        };
      }
    }
    this.ngZone.run(() => {
      this.atualizarGraficos();
    });
  }
  async atualizarGraficos() {
    setTimeout(() => {
      if (this.gastosChart) {
        this.gastosChart.update();
      }
      if (this.adicoesChart) {
        this.adicoesChart.update();
      }
    }, 0);
    this.ngZone.run(() => {
      this.gastosChart = this.gastosChart;
      this.adicoesChart = this.adicoesChart;
    });

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
