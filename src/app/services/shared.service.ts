import { Injectable } from '@angular/core';
import { supabase } from '../services/supabaseClient';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  constructor() {
  }
    async carregarProfiles(filialId?: string | null): Promise<any[]> {
    const filtro = filialId;
    let query = supabase
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
  
  async carregarFiliais(): Promise<any[]> {
    const { data, error } = await supabase
      .from('filiais')
      .select('id, nome, cidade, gerente:profiles!filiais_gerente_id_fkey ( name )')
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
      Filial: cupom.filial ?? cupom.filial_nome ?? '',
      Aprovador: cupom.aprovacao ?? cupom.aprovador_nome ?? '',
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
      Aprovador: solicitacao.aprovador,
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'Solicitacoes': worksheet }, SheetNames: ['Solicitacoes'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, nomeArquivo);
  }
  exportarRecargasGerente(solicitacoes: any[], nomeArquivo: string = 'relatorio_solicitacoes.xlsx'): void {
    if (!solicitacoes || solicitacoes.length === 0) {
      console.warn('Nenhum dado para exportar');
      return;
    }

    const exportData = solicitacoes.map(solicitacao => ({
      ID: solicitacao.id,
      Colaborador: solicitacao.usuario,
      Data: solicitacao.data,
      Tipo: solicitacao.tipo,
      Valor: solicitacao.valor,
      Status: solicitacao.status,
      StatusRH: solicitacao.statusRH,
      Observacoes: solicitacao.observacoes,
      Aprovador: solicitacao.aprovador,
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'Solicitacoes': worksheet }, SheetNames: ['Solicitacoes'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, nomeArquivo);
  }
  calcularPeriodo(
    periodoSelecionado: string | null | undefined = undefined,
    dataInicio?: Date | undefined,
    dataFim?: Date | undefined,
    mesSelecionado = null,
    trimestreSelecionado = null,
    semestreSelecionado = null,
  ): { startDate?: Date; endDate?: Date } {
    let startDate: Date | null | undefined= undefined;
    let endDate: Date | null | undefined= undefined;

    const ano = new Date().getFullYear();

    switch (periodoSelecionado) {
      case 'mensal':
        const mes = Number(mesSelecionado);
        if (mes === 1) {
          startDate = new Date(ano, 0, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(ano, 1, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (mes === 2) {
          startDate = new Date(ano, 1, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(ano, 2, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (mes === 3) {
          startDate = new Date(ano, 2, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(ano, 3, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (mes === 4) {
          startDate = new Date(ano, 3, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(ano, 4, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (mes === 5) {
          startDate = new Date(ano, 4, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(ano, 5, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (mes === 6) {
          startDate = new Date(ano, 5, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(ano, 6, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (mes === 7) {
          startDate = new Date(ano, 6, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(ano, 7, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (mes === 8) {
          startDate = new Date(ano, 7, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(ano, 8, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (mes === 9) {
          startDate = new Date(ano, 8, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(ano, 9, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (mes === 10) {
          startDate = new Date(ano, 9, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(ano, 10, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (mes === 11) {
          startDate = new Date(ano, 10, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(ano, 11, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (mes === 12) {
          startDate = new Date(ano, 11, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(ano, 12, 0);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      case 'trimestral':
        if (trimestreSelecionado) {
          const inicioMes = (trimestreSelecionado - 1) * 3;
          startDate = new Date(ano, inicioMes, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(ano, inicioMes + 3, 0);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      case 'semestral':
        const semestre = Number(semestreSelecionado);
        if (semestre === 1) {
          startDate = new Date(ano, 0, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(ano, 6, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (semestre === 2) {
          startDate = new Date(ano, 6, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(ano, 12, 0);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      case 'anual':
        startDate = new Date(ano, 0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(ano, 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'todos':
        startDate = null;
        endDate = null;
        break;
      case 'personalizado':
        if (dataInicio && dataFim) {
          startDate = new Date(dataInicio);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(dataFim);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
    }
    return { startDate: startDate || undefined, endDate: endDate || undefined };
  }
}


