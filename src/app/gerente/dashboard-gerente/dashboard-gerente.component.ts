import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule, NgFor, } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { SidebarGerenteComponent } from '../shared-gerente/sidebar.component';
import { SharedService } from '../../services/shared.service';
import { NgZone } from '@angular/core';
import { filter } from 'rxjs/operators';

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
    SidebarGerenteComponent
  ]
})
export class DashboardGerenteComponent implements OnInit {
  supabase: SupabaseClient;
  cupons: any[] = [];
  filialId: string | null = null;
  filiais: any[] = [];
  profiles: any[] = [];
  usuario: any[] = [];
  rankingGastos: any[] = [];
  rankingExtrapolo: any[] = [];
  colaboradorId: string | null | undefined = undefined;
  totalGasto = 0;
  totalOrcamento = 0;
  totalDeficit = 0;
  totalDescontado = 0;
  totalExcedenteAprovado = 0;
  periodoSelecionado: string | null | undefined = undefined;
  dataInicio?: Date;
  dataFim?: Date;
  trimestreSelecionado: null | undefined;
  semestreSelecionado: null | undefined;
  mesSelecionado: null | undefined;

  constructor(
    private auth: AuthService, 
    private router: Router, 
    private sharedService: SharedService,
    private ngZone: NgZone
  ) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  async ngOnInit() {
    this.filialId = this.auth.getFilialId();
    await this.carregarDados();
    await this.carregarUsuarios();
    this.carregarComFiltros();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.carregarDados();
        this.carregarUsuarios();
      });
  }

  onColaboradorChange() {
    console.log('Usuário selecionado:', this.colaboradorId);
    this.carregarDados();
  }
  async carregarUsuarios() {
    this.profiles = await this.sharedService.carregarProfiles(
      this.filialId
    );
    this.ngZone.run(() => {
      this.profiles = this.profiles;
    });
    
  }
  async carregarDados(
    periodoSelecionado?: string | null,
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
      this.cupons = await this.sharedService.carregarCuponsGerente(
        this.filialId,
        this.colaboradorId,
        startDate,
        endDate
      );
      this.ngZone.run(() => {
      this.cupons = this.cupons;
      this.processarIndicadoresGerente();
    });
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
    }
  }
  async carregarComFiltros(filialId?: string, colaboradorId?: string) {
    this.cupons = await this.sharedService.carregarCuponsGerente(
      filialId,
      colaboradorId
    );
  }

  async processarIndicadoresGerente() {

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
    this.processarIndicadoresGerente();
  }
}