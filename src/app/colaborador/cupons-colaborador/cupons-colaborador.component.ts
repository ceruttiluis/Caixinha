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
      const valorBase = this.getValorBase(c.tipo_gasto);
      const diferenca = Number((c.valor - valorBase).toFixed(2));
      const exceDeficit = Number((valorBase - c.valor).toFixed(2));

      return {
        id: c.id,
        usuario: c.usuario_nome,
        data: c.data_nota,
        tipo: c.tipo_gasto,
        valor: c.valor,
        imagem: this.getPublicImageUrl(c.url_imagem),
        link: c.url_imagem,
        status: c.status,
        diferenca,
        exceDeficit,
        observacoes: c.observacoes,
        aprovacao: c.aprovado_por_nome
      };
    });
    this.separarListas();
  }

  separarListas() {
    this.cuponsPendentes = this.cupons.filter(c => c.status === 'PENDENTE');
    this.cuponsAprovados = this.cupons.filter(c => c.status === 'APROVADO');
    this.cuponsReprovados = this.cupons.filter(c => c.status === 'DESCONTADO');
  }

  private getValorBase(tipo: string): number {
    const valores: Record<string, number> = {
      'Almoço': 35,
      'Janta': 35,
      'Café da Manhã': 15,
      'Hospedagem': 130
    };
    return valores[tipo] ?? 0;
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