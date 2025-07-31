import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class ColaboradorGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

   async canActivate(): Promise<boolean> {
    const role = await this.authService.getRole();
    if (role === 'COLABORADOR') return true;

    this.router.navigate(['/login']);
    return false;
  }
}