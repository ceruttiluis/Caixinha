import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SharedService } from '../shared.service';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
})
export class HeaderComponent {
  carteira: string | null = null;
  supabase: SupabaseClient;
  constructor(private auth: AuthService, private router: Router, private sharedService: SharedService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  async ngOnInit() {
    await this.carregarCarteira();
  }
  async carregarCarteira() {

    const { data: { user }, error: userError } = await this.supabase.auth.getUser();

    if (userError || !user) {
      console.error('Usuário não autenticado:', userError?.message);
      return;
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar adicoes:', error.message);
      return;
    }

    this.carteira =  data?.carteira || 0;
  }
}