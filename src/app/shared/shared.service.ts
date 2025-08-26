import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  processarIndicadores(cupons: any[]): {
    totalGasto: number,
    totalOrcamento: number,
    totalDeficit: number,
    totalDescontado: number,
    totalExcedenteAprovado: number
  } {
    let totalGasto = 0;
    let totalOrcamento = 0;
    let totalDeficit = 0;
    let totalDescontado = 0;
    let totalExcedenteAprovado = 0;

    for (const cupom of cupons) {
      totalGasto += cupom.valor;
      totalOrcamento += this.getValorBase(cupom.tipo || 0);

      const excedente = cupom.diferenca || 0;

      if (excedente > 0) {
        totalDeficit += excedente;

        if (cupom.status === 'DESCONTADO') {
          totalDescontado += excedente;
        } else if (cupom.status === 'APROVADO') {
          totalExcedenteAprovado += excedente;
        }
      }
    }
    return {
      totalGasto,
      totalOrcamento,
      totalDeficit,
      totalDescontado,
      totalExcedenteAprovado
    };
  }

  gerarRankings(cupons: any[]): {
    rankingGastos: { nome: string, total: number, filial: string }[],
    rankingExtrapolo: { nome: string, diferenca: number, filial: string }[]
  } {
    const gastosPorUsuario: Record<string, { total: number, filialNome: string }> = {};
    const excedentePorUsuario: Record<string, { diferenca: number, filialNome: string }> = {};

    for (const cupom of cupons) {
      const nome = cupom.usuario;
      const filialNome = cupom.filial;

      if (!gastosPorUsuario[nome]) {
        gastosPorUsuario[nome] = { total: 0, filialNome };
      }
      gastosPorUsuario[nome].total += cupom.valor;

      if (cupom.diferenca > 0) {
        if (!excedentePorUsuario[nome]) {
          excedentePorUsuario[nome] = { diferenca: 0, filialNome };
        }
        excedentePorUsuario[nome].diferenca += cupom.diferenca;
      }
    }

    const rankingGastos = Object.entries(gastosPorUsuario)
      .map(([nome, dados]) => ({ nome, total: dados.total, filial: dados.filialNome }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const rankingExtrapolo = Object.entries(excedentePorUsuario)
      .map(([nome, dados]) => ({ nome, diferenca: dados.diferenca, filial: dados.filialNome }))
      .sort((a, b) => b.diferenca - a.diferenca)
      .slice(0, 5);

    return { rankingGastos, rankingExtrapolo };
  }
  getValorBase(tipo: string | number): number {
    switch (tipo) {
      case 'Almoço': return 35;
      case 'Janta': return 35;
      case 'Café da Manhã': return 15;
      case 'Hospedagem': return 130;
      default: return 0;
    }
  }

  async carregarCuponsCIOP(filialId?: string, colaboradorId?: string): Promise<any[]> {
    let query = this.supabase
      .from('cupons_com_usuario')
      .select('*');

    if (filialId) {
      query = query.eq('filial_id', filialId);
    }
    if (colaboradorId) {
      query = query.eq('usuario_id', colaboradorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar cupons:', error.message);
      return [];
    }

    return (data || []).map((c: any) => {
      const valorBase = this.getValorBase(c.tipo_gasto);
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
        link: c.url_imagem,
        status: c.status,
        filial: c.filial_nome,
        diferenca,
        exceDeficit,
        descontar: c.descontar,
        observacoes: c.observacoes,
      };
    });
  }
  separarListas(cupons: any[]) {
    return {
      pendentes: cupons.filter(c => c.status === 'PENDENTE'),
      aprovados: cupons.filter(c => c.status === 'APROVADO'),
      reprovados: cupons.filter(c => c.status === 'DESCONTADO'),
    };
  }

}


