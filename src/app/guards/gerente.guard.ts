import { Injectable } from '@angular/core';
import { CanActivate, Router,} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class GerenteGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const role = this.authService.getRoleSync();
    console.log('[GerenteGuard] Role detectada:', role);
    if (role === 'GERENTE') return true;

    this.router.navigate(['/login']);
    return false;
  }
}