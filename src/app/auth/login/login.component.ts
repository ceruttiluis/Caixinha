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
  ){
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }
  
  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    try {
      const userData = await this.authService.login(email, password);
      console.log('[Login] Login bem-sucedido:', userData);
      const role = await this.authService.getRoleSync();
      console.log('Role detectada:', userData.role);

      const redirectUrl = `/${userData.role.toLowerCase()}`;

      setTimeout(() => {
        switch(userData.role) {
          case 'CIOP':
            this.router.navigate(['/ciop']);
            break;
          case 'GERENTE':
            this.router.navigate(['/home']);
            break;
          case 'COLABORADOR':
            this.router.navigate(['/home']);
            break;
          default:
            this.errorMessage = 'Tipo de usuário não reconhecido.';
        }
      }, 100);
    } catch (error: any) {
      console.error('Erro completo:', error);
      this.errorMessage = error.message || 'Credenciais inválidas ou erro no servidor';
    } finally {
      this.loading = false;
    }
  }
}