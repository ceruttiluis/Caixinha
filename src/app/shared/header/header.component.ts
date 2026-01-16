import { Component, NgZone } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { supabase } from '../../services/supabaseClient';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
})
export class HeaderComponent {
  carteira: string | null = null;
  name: string | null = null;
  constructor(
    private auth: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {
  }
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  async ngOnInit() {
    await this.carregarCarteira();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.carregarCarteira();
      });
  }
  async carregarCarteira() {

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Usuário não autenticado:', userError?.message);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar adicoes:', error.message);
      return;
    }

    this.name = data?.name || 'Usuário';
    this.carteira =  data?.carteira || 0;
    this.ngZone.run(() => {
      this.carteira = this.carteira;
    });
  }
}