import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class CiopGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const role = await this.authService.getRole();
     console.log('[CiopGuard] Role detectada:', role);
    if (role === 'CIOP') return true;

    this.router.navigate(['/login']);
    return false;
  }
}