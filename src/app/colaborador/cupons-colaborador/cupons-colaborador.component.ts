import { Router } from '@angular/router';
import { CommonModule, NgFor } from '@angular/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { FormsModule } from '@angular/forms';
import { Component, HostListener } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { SidebarColaboradorComponent } from '../shared-colaborador/sidebar.component';
import { SharedModule } from "../../shared/shared.module";
import { SharedService } from '../../shared/shared.service';

type CupomStatus = 'PENDENTE' | 'APROVADO' | 'DESCONTADO';

interface Cupom {
  id: number;
  usuario: string;
  data: Date;
  tipo: string;
  valor: number;
  imagem: string;
  status: CupomStatus;
  diferenca: number;
  exceDeficit: number;
  descontar?: boolean;
  observacoes: string;
  aprovacao: string;
  link: string;
}

@Component({
  selector: 'app-cupons-colaborador',
  templateUrl: './cupons-colaborador.component.html',
  styleUrls: ['./cupons-colaborador.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    NgFor,
    CommonModule,
    SidebarColaboradorComponent,
    SharedModule
  ]
})
export class CuponsColaboradorComponent {
  supabase: SupabaseClient;
  filialId: string | null = null;
  filialSelecionada: string = '';
  tooltipOpenId: string | null = null;

  cuponsPendentes: Cupom[] = [];
  cuponsAprovados: Cupom[] = [];
  cuponsReprovados: Cupom[] = [];
  cupons: any[] = [];

  constructor(private auth: AuthService, private router: Router, private sharedService: SharedService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async ngOnInit() {
    this.filialId = this.auth.getFilialId();
    await this.carregarDados();
  }

  async carregarDados() {
    try {
      this.cupons = await this.sharedService.carregarCuponsColaborador();

      console.log('Cupons carregados:', this.cupons);
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
    }
    this.separarListas();
  }

  separarListas() {
    this.cuponsPendentes = this.cupons.filter(c => c.status === 'PENDENTE');
    this.cuponsAprovados = this.cupons.filter(c => c.status === 'APROVADO');
    this.cuponsReprovados = this.cupons.filter(c => c.status === 'DESCONTADO');
  }


  private getPublicImageUrl(path?: string): string {
    if (!path) return '';

    let filePath = path.trim();

    if (filePath.startsWith('http')) {
      const match = filePath.match(/cupons\/(.+)$/);
      if (match) {
        filePath = match[1];
      }
    }

    const { data: pu } = this.supabase.storage
      .from('cupons')
      .getPublicUrl(filePath);

    let publicUrl = pu?.publicUrl || '';

    if (publicUrl) {
      publicUrl += (publicUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
    }

    return publicUrl;
  }
  isTooltipOpen(id: number | string): boolean {
    return this.tooltipOpenId === String(id);
  }

  toggleTooltip(id: number | string) {
    const key = String(id);
    this.tooltipOpenId = this.tooltipOpenId === key ? null : key;
  }

  @HostListener('document:click')
  closeTooltip() {
    this.tooltipOpenId = null;
  }
  exportarParaExcel() {
    this.sharedService.exportarParaExcel(this.cupons)
  }
}