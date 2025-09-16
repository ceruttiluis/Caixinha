import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { supabase } from '../services/supabaseClient';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
})
export class HomeComponent {
  currentUser: any;
  constructor(private auth: AuthService, private router: Router) 
  {}

  async ngOnInit() {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
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
        this.router.navigate(['/colaborador']);
      } else if (role === 'moderator') {
        this.router.navigate(['/gerente']);
      }
    } 
  
    else if (option === 'cupon') {
      if (role === 'user') {
        this.router.navigate(['/lancar-cupom']);
      } else if (role === 'moderator') {
        this.router.navigate(['/lancar-cupom']);
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