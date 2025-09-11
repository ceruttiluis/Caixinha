import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar-dp',
  templateUrl: './sidebarDP.component.html',
  styleUrls: ['./sidebarDP.component.scss'],
  standalone: true,
  imports: [RouterModule]
})
export class SidebarDPComponent {
  constructor(private auth: AuthService, private router: Router) { }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}