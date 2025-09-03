import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup, Validators, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { SharedModule } from '../../shared/shared.module';
import { SharedService } from '../../shared/shared.service';
import { UsuariosService, Usuario } from '../../services/usuarios.service';

interface User {
  id?: number;
  gerente: string;
  filial: string;
}

interface Filial {
  id?: number;
  nome: string;
  cidade: string;
}

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule, SidebarCiopComponent, ReactiveFormsModule, SharedModule],
  standalone: true
})
export class UsuariosComponent implements OnInit {
  profileForm: FormGroup;
  supabase: SupabaseClient;
  uploading = false;
  usuarios: any[] = [];
  profiles: User[] = [];
  filiais: Filial[] = [];
  gerentes: any[] = [];

  constructor(private fb: FormBuilder, private auth: AuthService, private sharedService: SharedService, private usuarioService: UsuariosService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    this.profileForm = this.fb.group({
      password: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      role: ['', Validators.required],
      filial: ['', Validators.required],
      gerente: ['']
    });
  }

  async ngOnInit() {
    this.carregarUsuarios()
    this.carregarFiliais()
    this.carregarGerentes()
  }

  async carregarUsuarios() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, name, email, role, filial:filial_id ( nome ), gerente:gerente_id ( name )')
      .order('id', { ascending: false });
    if (error) console.error(error);
    else this.usuarios = data || [];
  }

  async carregarFiliais() {
    this.filiais = await this.sharedService.carregarFiliais();
  }

  async carregarGerentes() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, name, role')
      .eq('role', 'moderator');

    if (error) console.error(error);
    else this.gerentes = data || [];
  }

  criarUsuario(): void {
    if (this.profileForm.invalid) {
      return;
    }
    this.uploading = true;

    const { email, name, role, filial, gerente, password } = this.profileForm.value;

    const novoUsuario = {
      email,
      name,
      role,
      filial_id: filial,
      carteira: 0,
      gerente_id: gerente,
      password
    };
    this.usuarioService.criarUsuario(novoUsuario).subscribe({
    next: (res) => {
      console.log('Usuário criado com sucesso!', res);
      this.carregarUsuarios();
      this.profileForm.reset();
      this.uploading = false;
    },

    error: (err) => {
      console.error('Erro ao criar usuário:', err.error?.error || err.message);
      this.uploading = false;
    }
  });
  }

  excluirUsuario(id: string): void{
    this.usuarioService.excluirUsuario(id).subscribe({
      next: () => {
        console.log('Usuário excluído com sucesso!');
        this.carregarUsuarios();
      },
      error: (err) => {
        console.error('Erro ao excluir usuário:', err);
      }
    });
  }
}