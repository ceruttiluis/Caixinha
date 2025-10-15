import { Injectable } from '@angular/core';
import { supabase } from '../services/supabaseClient';

@Injectable({
  providedIn: 'root'
})
export class CupomService {

  constructor() {
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

      if (cupom.tipo === 'Outros'){
        totalOrcamento += cupom.valor;
      } else {
        totalOrcamento += this.getValorBase(cupom.tipo || 0);
      }

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

    const rankingExtrapolo = Object.entries(excedentePorUsuario)
      .map(([nome, dados]) => ({ nome, diferenca: dados.diferenca, filial: dados.filialNome }))
      .sort((a, b) => b.diferenca - a.diferenca)

    return { rankingGastos, rankingExtrapolo };
  }
  getValorBase(tipo: string | number): number {
    switch (tipo) {
      case 'Almoço': return 35;
      case 'Janta': return 35;
      case 'Café da Manhã': return 15;
      case 'Hospedagem': return 130;
      case 'Outros' : return 0;
      default: return 0;
    }
  }
  
  async carregarCuponsGerente(filialId?: string | null, colaboradorId?: string | null, startDate?: Date | null, endDate?: Date | null): Promise<any[]> {
    const filtro = filialId;
    let query = supabase
      .from('cupons')
      .select(`
        id,
        tipo_gasto,
        usuario_id, 
        data_nota, 
        valor, 
        url_imagem, 
        status, 
        aprovador:profiles!cupons_aprovado_por_fkey ( name ),
        observacoes,
        usuario:profiles!cupons_usuario_id_fkey ( name ),
        filiais (nome)
        `);

    if (filtro) {
      query = query.eq('filial_id', filtro);
    }
    if (colaboradorId) {
      query = query.eq('usuario_id', colaboradorId);
    }
    if (startDate) {
      query = query.gte('data_nota', new Date(startDate).toISOString().split('T')[0]);
    }
    if (endDate) {
      query = query.lte('data_nota', new Date(endDate).toISOString().split('T')[0]);
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

        const { data: pu } = supabase.storage
          .from('cupons')
          .getPublicUrl(filePath);

        publicUrl = pu?.publicUrl || '';

        if (publicUrl) {
          publicUrl += (publicUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
        }
      }
      return {
        id: c.id,
        usuarioID: c.usuario_id,
        usuario: c.usuario?.name ?? '-',
        data: c.data_nota,
        tipo: c.tipo_gasto,
        valor: c.valor,
        url_imagem: publicUrl,
        imagem: c.url_imagem,
        link: c.url_imagem,
        status: c.status,
        filial: c.filiais?.nome,
        diferenca,
        exceDeficit,
        descontar: c.descontar,
        observacoes: c.observacoes,
        aprovacao: c.aprovador?.name ?? '-',
      };
    });
  }
  async carregarCuponsCiop(filialId?: string | null, colaboradorId?:  string | null, startDate?: Date, endDate?: Date): Promise<any[]> {

    let query = supabase
      .from('cupons')
      .select(`
        id,
        tipo_gasto, 
        data_nota, 
        valor, 
        url_imagem, 
        status, 
        observacoes,
        aprovador:profiles!cupons_aprovado_por_fkey ( name ),
        usuario:profiles!cupons_usuario_id_fkey ( name ),
        filiais (nome)
        `);

    if (filialId) {
      query = query.eq('filial_id', filialId);
    }
    if (colaboradorId) {
      query = query.eq('usuario_id', colaboradorId);
    }
    if (startDate) {
      query = query.gte('data_nota', new Date(startDate).toISOString().split('T')[0]);
    }
    if (endDate) {
      query = query.lte('data_nota', new Date(endDate).toISOString().split('T')[0]);
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

        const { data: pu } = supabase.storage
          .from('cupons')
          .getPublicUrl(filePath);

        publicUrl = pu?.publicUrl || '';

        if (publicUrl) {
          publicUrl += (publicUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
        }
      }
      return {
        id: c.id,
        usuario: c.usuario?.name ?? '-',
        data: c.data_nota,
        tipo: c.tipo_gasto,
        valor: c.valor,
        url_imagem: publicUrl,
        imagem: c.url_imagem,
        link: c.url_imagem,
        status: c.status,
        filial: c.filiais?.nome,
        diferenca,
        exceDeficit,
        descontar: c.descontar,
        observacoes: c.observacoes,
        aprovacao: c.aprovador?.name ?? '-',
      };
    });
  }

  async carregarCuponsColaborador(filialId?: string | null,  startDate?: Date, endDate?: Date): Promise<any[]> {
    const filtro = filialId;
    let query = supabase
      .from('cupons')
      .select(`
        id,
        tipo_gasto, 
        data_nota, 
        valor, 
        url_imagem, 
        status, 
        observacoes,
        usuario:profiles!cupons_usuario_id_fkey ( name ),
        aprovador:profiles!cupons_aprovado_por_fkey ( name ),
        filiais (nome)
        `);

    if (filtro) {
      query = query.eq('filial_id', filtro);
    }
    if (startDate) {
      query = query.gte('data_nota', new Date(startDate).toISOString().split('T')[0]);
    }
    if (endDate) {
      query = query.lte('data_nota', new Date(endDate).toISOString().split('T')[0]);
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

        const { data: pu } = supabase.storage
          .from('cupons')
          .getPublicUrl(filePath);

        publicUrl = pu?.publicUrl || '';

        if (publicUrl) {
          publicUrl += (publicUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
        }
      }
      return {
        id: c.id,
        usuario: c.usuario?.name ?? '-',
        data: c.data_nota,
        tipo: c.tipo_gasto,
        valor: c.valor,
        url_imagem: publicUrl,
        imagem: c.url_imagem,
        link: c.url_imagem,
        status: c.status,
        filial: c.filiais?.nome,
        diferenca,
        exceDeficit,
        descontar: c.descontar,
        observacoes: c.observacoes,
        aprovacao: c.aprovador?.name ?? '-',
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