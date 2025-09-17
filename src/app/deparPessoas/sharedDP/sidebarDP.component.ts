import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar-dp',
  templateUrl: './sidebarDP.component.html',
  styleUrls: ['./sidebarDP.component.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule]
})
export class SidebarDPComponent implements OnInit {
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