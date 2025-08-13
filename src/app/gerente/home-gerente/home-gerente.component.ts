import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home-gerente',
  templateUrl: './home-gerente.component.html',
  styleUrls: ['./home-gerente.component.scss'],
  standalone: true,
})
export class HomeGerenteComponent {
  constructor(private auth: AuthService, private router: Router) {}

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
    selectOption(option: string): void {
    if (option === 'dashboard') {
      this.router.navigate(['/gerente']);
    } else if (option === 'coupon') {
      this.router.navigate(['/colaborador']);
    }
  }
}