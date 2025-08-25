import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
})
export class HomeComponent {
  supabase: SupabaseClient;
  currentUser: any;
  constructor(private auth: AuthService, private router: Router) 
  {this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);}

  async ngOnInit() {
    const { data: { user } } = await this.supabase.auth.getUser();

    if (user) {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id, role, filial_id')
        .eq('id', user.id) 
        .single();

      if (!error && data) {
        this.currentUser = data;
      } else {
      }
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
  selectOption(option: string): void {
    const role = this.currentUser?.role; 
    if (option === 'dashboard') {
      if (role === 'user') {
        this.router.navigate(['/dash-colaborador']);
      } else if (role === 'moderator') {
        this.router.navigate(['/gerente']);
      } else if (role === 'admin') {
        this.router.navigate(['/ciop']);
      }
    } 
  
    else if (option === 'cupon') {
      if (role === 'user') {
        this.router.navigate(['/colaborador']);
      } else if (role === 'moderator') {
        this.router.navigate(['/colaborador']);
      }
    }
     else if (option === 'recarga') {
      if (role === 'user') {
        this.router.navigate(['/solicitacao']);
      } else if (role === 'moderator') {
        this.router.navigate(['/solicitacao']);
      }
    }
  }
}