import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { SidebarColaboradorComponent } from '../shared-colaborador/sidebar.component';
import { SharedService } from '../../services/shared.service';
import { NgZone } from '@angular/core';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-dash-colaborador',
  templateUrl: './dash-colaborador.component.html',
  styleUrls: ['./dash-colaborador.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SharedModule,
    SidebarColaboradorComponent
  ]
})
export class DashColaboradorComponent implements OnInit {
  cupons: any[] = [];
  filialId: string | null = null;
  rankingGastos: any[] = [];
  rankingExtrapolo: any[] = [];
  totalGasto = 0;
  totalOrcamento = 0;
  totalDeficit = 0;
  totalDescontado = 0;
  totalExcedenteAprovado = 0;
  periodoSelecionado: string = '';
  dataInicio?: Date;
  dataFim?: Date;
  trimestreSelecionado: null | undefined;
  semestreSelecionado: null | undefined;
  mesSelecionado: null | undefined;

  constructor(
    private auth: AuthService,
    private router: Router,
    private sharedService: SharedService,
    private ngZone: NgZone,) {
  }
  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  async ngOnInit() {
    this.filialId = this.auth.getFilialId();
    await this.carregarDados();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.carregarDados();
      });
  }

  async carregarDados(
    periodoSelecionado?: string | undefined,
    dataInicio?: Date,
    dataFim?: Date
  ) {
    try {
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      if (periodoSelecionado) {
        const periodo = this.sharedService.calcularPeriodo(
          periodoSelecionado,
          dataInicio,
          dataFim,
          this.mesSelecionado,
          this.trimestreSelecionado,
          this.semestreSelecionado
        );
        startDate = periodo.startDate || undefined;
        endDate = periodo.endDate || undefined;
      } else if (dataInicio && dataFim) {
        startDate = dataInicio;
        endDate = dataFim;
      }
      this.cupons = await this.sharedService.carregarCuponsColaborador(
        this.filialId,
        startDate,
        endDate
      );
      this.ngZone.run(() => {
      this.cupons = this.cupons;
      this.processarIndicadoresColaborador();
    });
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
    }
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

  async aplicarFiltros() {
    const { startDate, endDate } = this.sharedService.calcularPeriodo(
      this.periodoSelecionado,
      this.dataInicio,
      this.dataFim,
      this.mesSelecionado,
      this.trimestreSelecionado,
      this.semestreSelecionado,
    );
    this.carregarDados(this.periodoSelecionado, startDate, endDate);
    this.processarIndicadoresColaborador();
  }
}