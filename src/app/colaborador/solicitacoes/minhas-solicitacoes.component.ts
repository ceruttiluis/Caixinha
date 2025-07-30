import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { CommonModule, DatePipe } from '@angular/common'; 
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-minhas-solicitacoes',
  templateUrl: './minhas-solicitacoes.component.html',
  styleUrls: ['./minhas-solicitacoes.component.scss'],
  standalone: true,
  imports: [CommonModule, DatePipe, SharedModule]
})
export class MinhasSolicitacoesComponent implements OnInit {
  supabase: SupabaseClient;
  cupons: any[] = [];
  loading = true;

  constructor(private auth: AuthService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async ngOnInit() {
    const userId = this.auth.getUserId();
    const { data, error } = await this.supabase
      .from('cupons_com_excedente') // ou 'cupons' se não tiver a view
      .select('*')
      .eq('usuario_id', userId)
      .order('data_nota', { ascending: false });

    if (!error) {
      this.cupons = data || [];
    }

    this.loading = false;
  }
}