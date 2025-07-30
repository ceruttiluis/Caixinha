import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { CommonModule, NgStyle } from '@angular/common'; 
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';



@Component({
  selector: 'app-dashboard-ciop',
  templateUrl: './dashboard-ciop.component.html',
 //tyleUrls: ['./dashboard-ciop.component.scss']
  standalone: true,
  imports: [SidebarCiopComponent, CommonModule, NgStyle]
})
export class DashboardCiopComponent implements OnInit {
  supabase: SupabaseClient;
  cupons: any[] = [];
  filialId: string | null = null;

  constructor(private auth: AuthService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async ngOnInit() {
    this.filialId = this.auth.getFilialId(); // supondo que auth guarde o ID da filial

    const { data, error } = await this.supabase
      .from('cupons_com_excedente')
      .select('*')
      .eq('filial_id', this.filialId);

    if (!error) this.cupons = data || [];
  }

  async updateStatus(id: number, status: string) {
    await this.supabase
      .from('cupons')
      .update({ status })
      .eq('id', id);

    await this.ngOnInit(); // refresh
  }
  exportarParaExcel() {
    const exportData = this.cupons.map(cupom => ({
      Colaborador: cupom.usuario_nome,
      Tipo: cupom.tipo_gasto,
      Valor: cupom.valor,
      Excedente: cupom.excedente,
      Status: cupom.status,
      Data: cupom.data_nota
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'Cupons': worksheet }, SheetNames: ['Cupons'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, 'relatorio_cupons.xlsx');
  }
}
