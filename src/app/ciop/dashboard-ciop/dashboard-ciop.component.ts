import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule, NgFor, } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
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
  colaboradorSelecionado: string | null = null;

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
    await this.carregarProfiles();
    await this.carregarFiliais();
    this.processarIndicadorCiop();
  }

  onFilialChange() {
    const filial = this.filiais.find(f => f.nome === this.filialSelecionada);
    this.filialId = filial ? filial.id : null;

    console.log('Filial selecionada:', this.filialSelecionada);
    this.carregarProfiles();
    this.carregarDados();
  }

  onColaboradorChange() {
    const colaborador = this.profiles.find(c => c.nome === this.colaboradorSelecionado);
    this.colaboradorSelecionado = colaborador ? colaborador.id : null;
    console.log('Usuario selecionado:', this.colaboradorSelecionado);
    this.carregarDados();
  }

  async carregarDados() {

    let query = this.supabase
      .from('cupons_com_usuario')
      .select('*');

    if (this.filialSelecionada) {
      query = query.eq('filial_id', this.filialSelecionada);
    }
    if (this.colaboradorSelecionado) {
      query = query.eq('usuario_id', this.colaboradorSelecionado);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar cupons:', error.message);
      return;
    }

    this.cupons = (data || []).map((c: any) => {
      const valorBase = this.sharedService.getValorBase(c.tipo_gasto);
      const diferenca = Number((c.valor - valorBase).toFixed(2));
      const exceDeficit = Number((valorBase - c.valor).toFixed(2));

      let publicUrl = '';

      if (c.url_imagem) {
        let filePath = c.url_imagem.trim();

        if (filePath.startsWith('http')) {
          const match = filePath.match(/cupons\/(.+)$/);
          if (match) {
            filePath = match[1];
          }
        }
        const { data: pu } = this.supabase.storage
          .from('cupons')
          .getPublicUrl(filePath);

        publicUrl = pu?.publicUrl || '';

        if (publicUrl) {
          publicUrl += (publicUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
        }
      }
      return {
        id: c.id,
        usuario: c.usuario_nome,
        data: c.data_nota,
        tipo: c.tipo_gasto,
        valor: c.valor,
        url_imagem: publicUrl,
        imagem: c.url_imagem,
        status: c.status,
        filial: c.filial_nome,
        diferenca,
        exceDeficit,
        descontar: c.descontar
      };
    });

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

  async carregarProfiles() {
    let query = this.supabase
      .from('profiles')
      .select('*')
    if (this.filialSelecionada) {
      query = query.eq('filial_id', this.filialSelecionada);
    }

    const { data, error } = await await query;

    if (error) {
      console.error('Erro ao buscar usuarios:', error.message);
      return;
    }

    this.profiles = (data || []).map((p: any) => ({
      id: p.id,
      nome: p.name,
    }));
  }

  async carregarFiliais() {
    this.filiais = await this.sharedService.carregarFiliais();
  }
}