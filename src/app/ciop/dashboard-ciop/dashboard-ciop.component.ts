import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule, NgFor, } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SharedService } from '../../shared/shared.service';

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
  usuario: any[] = [];
  profiles: any[] = [];
  filiais: any[] = [];
  rankingGastos: any[] = [];
  rankingExtrapolo: any[] = [];
  filialSelecionada: string = '';
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
    await this.carregarDados();
    await this.carregarUsuarios();
    await this.carregarFiliais();
    this.carregarComFiltros();
  }

  onFilialChange() {
    console.log('Filial selecionada:', this.filialSelecionada);
    this.carregarUsuarios();
    this.carregarDados();
  }
  async carregarFiliais() {
    this.filiais = await this.sharedService.carregarFiliais();
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
  async carregarComFiltros(filialId?: string, colaboradorId?: string) {
    this.cupons = await this.sharedService.carregarCuponsCiop(
      filialId,
      colaboradorId
    );
  }

  async carregarDados() {
    try {
      this.cupons = await this.sharedService.carregarCuponsCiop(
        this.filialSelecionada,
        this.colaboradorSelecionado
      );
    } catch (error) {
      console.error('Erro ao carregar cupons do gerente:', error);
    }
    this.processarIndicadorCiop();
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
    await this.supabase
      .from('cupons')
      .update({ status })
      .eq('id', id);

    await this.carregarDados();
  }

}