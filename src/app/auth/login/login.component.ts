import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', Validators.required]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const { email, senha } = this.loginForm.value;

    try {
      await this.authService.login(email, senha);
      const role = await this.authService.getRole();

      if (role === 'CIOP') this.router.navigate(['/ciop']);
      else if (role === 'GERENTE') this.router.navigate(['/gerente']);
      else if (role === 'COLABORADOR') this.router.navigate(['/colaborador']);
      else throw new Error('Tipo de usuário desconhecido.');
    } catch (error: any) {
      this.errorMessage = error.message || 'Erro ao fazer login';
    } finally {
      this.loading = false;
    }
  }
}