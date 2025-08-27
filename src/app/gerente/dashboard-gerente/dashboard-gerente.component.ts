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
  filiais: any[] = [];
  profiles: any[] = [];
  usuario: any[] = [];
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
    this.filialId = this.auth.getFilialId();
    await this.carregarDados();
    await this.carregarProfiles();
    this.processarIndicadoresGerente();
  }
  onColaboradorChange() {
    const colaborador = this.profiles.find(c => c.nome === this.colaboradorSelecionado);
    this.colaboradorSelecionado = colaborador ? colaborador.id : null;
    console.log('Usuario selecionado:', this.colaboradorSelecionado);
    this.carregarDados();
  }
  async carregarDados() {
    const filtroFilial = this.filialSelecionada || this.filialId;

    let query = this.supabase
      .from('cupons_com_usuario')
      .select('*');

    if (filtroFilial) {
      query = query.eq('filial_id', filtroFilial);
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
    this.processarIndicadoresGerente();
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
  async carregarProfiles() {
    const filtro = this.filialSelecionada || this.filialId;

    let query = this.supabase
      .from('profiles')
      .select('*')
      .order('id', { ascending: false });

    if (filtro) {
      query = query.eq('filial_id', filtro);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar usuarios:', error.message);
      return;
    }
    this.profiles = (data || []).map((p: any) => ({
      id: p.id,
      nome: p.name,
    }));
  }
}