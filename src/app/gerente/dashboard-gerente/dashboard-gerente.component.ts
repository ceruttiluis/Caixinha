import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule, NgFor, } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SidebarGerenteComponent } from '../shared-gerente/sidebar.component';
import { SharedService } from '../../shared/shared.service';

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
  filialSelecionada?: string;
  filiais: any[] = [];
  profiles: any[] = [];
  usuario: any[] = [];
  rankingGastos: any[] = [];
  rankingExtrapolo: any[] = [];
  colaboradorSelecionado?: string;
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
    this.carregarDados();
    await this.carregarUsuarios();
    this.carregarComFiltros();
  }

  onColaboradorChange() {
    console.log('Usuário selecionado:', this.colaboradorSelecionado);
    this.carregarDados();
  }
  async carregarUsuarios() {
    this.profiles = await this.sharedService.carregarProfiles(
      this.filialSelecionada || this.filialId
    );
  }
  async carregarDados() {
    try {
      this.cupons = await this.sharedService.carregarCuponsGerente(
        this.filialSelecionada || this.filialId,
        this.colaboradorSelecionado
      );
    } catch (error) {
      console.error('Erro ao carregar cupons do gerente:', error);
    }
    this.processarIndicadoresGerente();
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
}