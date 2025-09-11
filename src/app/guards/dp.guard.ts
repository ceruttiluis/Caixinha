import { Injectable } from '@angular/core';
import { CanActivate, Router} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class DPGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const role = this.authService.getRoleSync();
    console.log('[DPGuard] Role detectada:', role);
    if (role === 'DP') return true;

    this.router.navigate(['/login']);
    return false;
  }
}