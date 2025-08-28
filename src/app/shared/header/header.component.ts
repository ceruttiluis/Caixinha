import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
})
export class HeaderComponent {
  constructor(private auth: AuthService, private router: Router) { }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}