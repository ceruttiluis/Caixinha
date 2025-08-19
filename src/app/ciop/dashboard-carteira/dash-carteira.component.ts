import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartData, ChartEvent, ChartType } from 'chart.js';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { SharedModule } from '../../shared/shared.module';
import { NgChartsModule } from 'ng2-charts';

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
  selector: 'app-dashboard',
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
export class DashCarteiraComponent {
  supabase: SupabaseClient;
  cupons: any[] = [];
  adicoes: any[] = [];
  carteira: any[] = [];
  users: User[] = [];
  filialId: string | null = null;
  filialSelecionada: string = '';
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
    this.carregarCarteira()
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
        .select('profile_id, criado_em, observacoes, valor_add, profiles (name)');

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

        for (const carteira of this.carteira) {
        this.saldoTotal += carteira.valor;
        }
        for (const cupom of this.cupons) {
        this.totalGasto += cupom.valor;
        }
        for (const adicao of this.adicoes) {
        this.totalAdicoes += adicao.valor;
        }
        this.saldoAtual = this.saldoTotal - this.totalGasto;
  }
  barChartOptions = {
    responsive: true,
  };

  barChartLabels = ['Café', 'Almoço', 'Janta', 'Hospedagem'];
  barChartDatasets: ChartData<'bar'>['datasets'] =  [
    { data: [150, 350, 200, 800], label: 'Gastos' },
    { data: [300, 400, 250, 900], label: 'Limite' }
  ];
}
