import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { supabase } from '../../services/supabaseClient';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule, NgFor, } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { SharedService } from '../../services/shared.service';
import { NgZone } from '@angular/core';
import { filter } from 'rxjs/operators';

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
  cupons: any[] = [];
  filialId: string | null | undefined = undefined;
  profiles: any[] = [];
  filiais: any[] = [];
  rankingGastos: any[] = [];
  rankingExtrapolo: any[] = [];
  colaboradorId: string | null | undefined = undefined;
  periodoSelecionado: string = '';
  dataInicio?: Date;
  dataFim?: Date;
  trimestreSelecionado: null | undefined;
  semestreSelecionado: null | undefined;
  mesSelecionado: null | undefined;

  totalGasto = 0;
  totalOrcamento = 0;
  totalDeficit = 0;
  totalDescontado = 0;
  totalExcedenteAprovado = 0;

  constructor(
    private auth: AuthService,
    private router: Router,
    private sharedService: SharedService,
    private ngZone: NgZone
  ) {}
  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  async ngOnInit() {
    await this.carregarDados();
    await this.carregarUsuarios();
    await this.carregarFiliais();
    this.carregarComFiltros();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.carregarDados();
        this.carregarUsuarios();
        this.carregarFiliais();
      });
  }

  onFilialChange() {
    console.log('Filial selecionada:', this.filialId);
    this.carregarUsuarios();
    this.carregarDados();
  }
  async carregarFiliais() {
    this.filiais = await this.sharedService.carregarFiliais();
    this.ngZone.run(() => {
      this.filiais = this.filiais;
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
  async carregarComFiltros(filialId?: string, colaboradorId?: string) {
    this.cupons = await this.sharedService.carregarCuponsCiop(
      filialId,
      colaboradorId
    );
    console.log("Filial: ", filialId)
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
      this.cupons = await this.sharedService.carregarCuponsCiop(
        this.filialId,
        this.colaboradorId,
        startDate,
        endDate
      );
      this.ngZone.run(() => {
      this.cupons = this.cupons;
      this.processarIndicadorCiop();
    });

    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
    }
  }

  async processarIndicadorCiop() {

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
    await supabase
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
    this.processarIndicadorCiop();
  }
}