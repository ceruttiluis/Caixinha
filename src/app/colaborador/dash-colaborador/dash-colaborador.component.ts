import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule, NgFor, } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  rankingGastos: any[] = [];
  rankingExtrapolo: any[] = [];
  filialSelecionada: string = '';
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

  constructor(private auth: AuthService, private router: Router, private sharedService: SharedService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }
  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  async ngOnInit() {
    this.filialId = this.auth.getFilialId();
    await this.carregarDados();
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
        this.filialSelecionada,
        startDate,
        endDate
      );
      this.processarIndicadoresColaborador();
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