import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

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
  async carregarFiliais(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('filiais')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Erro ao buscar filiais:', error.message);
      return [];
    }

    return data || [];
  }
  exportarParaExcel(cupons: any[], nomeArquivo: string = 'relatorio_cupons.xlsx'): void {
    if (!cupons || cupons.length === 0) {
      console.warn('Nenhum dado para exportar');
      return;
    }

    const exportData = cupons.map(cupom => ({
      ID: cupom.id,
      Colaborador: cupom.usuario || cupom.usuario_nome,
      Data: cupom.data,
      Tipo: cupom.tipo,
      Valor: cupom.valor,
      Excedente: cupom.excedente ?? cupom.diferenca ?? 0,
      Status: cupom.status,
      Filial: cupom.filial ?? cupom.filial_nome ?? ''
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'Cupons': worksheet }, SheetNames: ['Cupons'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, nomeArquivo);
  }
  exportarExcelRecargas(solicitacoes: any[], nomeArquivo: string = 'relatorio_solicitacoes.xlsx'): void {
    if (!solicitacoes || solicitacoes.length === 0) {
      console.warn('Nenhum dado para exportar');
      return;
    }

   const exportData = solicitacoes.map(solicitacao => ({
      ID: solicitacao.id,
      Colaborador: solicitacao.usuario,
      Filial: solicitacao.filial,
      Data: solicitacao.data,
      Tipo: solicitacao.tipo,
      Valor: solicitacao.valor,
      Status: solicitacao.status,
      Observacoes: solicitacao.observacoes,
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'Solicitacoes': worksheet }, SheetNames: ['Solicitacoes'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, nomeArquivo);
  }
  async carregarCuponsGerente(filialSelecionada?: string | null, colaboradorSelecionado?: string): Promise<any[]> {
    const filtro = filialSelecionada;
    let query = this.supabase
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
        filiais (nome)
        `);

    if (filtro) {
      query = query.eq('filial_id', filtro);
    }
    if (colaboradorSelecionado) {
      query = query.eq('usuario_id', colaboradorSelecionado);
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
      };
    });
  }
  async carregarCuponsCiop(filialSelecionada?: string | null, colaboradorSelecionado?: string): Promise<any[]> {

    let query = this.supabase
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

    if (filialSelecionada) {
      query = query.eq('filial_id', filialSelecionada);
    }
    if (colaboradorSelecionado) {
      query = query.eq('usuario_id', colaboradorSelecionado);
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

  async carregarCuponsColaborador(filialId?: string, colaboradorId?: string): Promise<any[]> {
    const filtro = filialId;
    let query = this.supabase
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
  async carregarProfiles(filialId?: string | null): Promise<any[]> {
    const filtro = filialId;
    let query = this.supabase
      .from('profiles')
      .select('id, name')
      .order('name', { ascending: true });

    if (filtro) {
      query = query.eq('filial_id', filialId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar usuários:', error.message);
      return [];
    }

    return data || [];
  }

}


