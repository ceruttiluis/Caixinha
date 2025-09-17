import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar-colaborador',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule]
})
export class SidebarColaboradorComponent implements OnInit {
  sidebarOpen = false;
  constructor(private auth: AuthService, private router: Router, private ngZone: NgZone, private cd: ChangeDetectorRef) { }

   ngOnInit() {
    this.ngZone.run(() => {
      this.sidebarOpen = false;
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
  toggleSidebar() {
  this.sidebarOpen = !this.sidebarOpen;
  this.cd.detectChanges(); 
}
}