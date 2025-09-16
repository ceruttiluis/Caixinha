import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { supabase } from '../../services/supabaseClient';
import { FormsModule, FormGroup, Validators, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { SharedModule } from '../../shared/shared.module';
import { SharedService } from '../../services/shared.service';
import { UsuariosService, Usuario } from '../../services/usuarios.service';
import { HttpClientModule } from '@angular/common/http';
import { NgZone } from '@angular/core';
import { filter } from 'rxjs/operators';

interface Filial {
  id?: number;
  nome: string;
  cidade: string;
}

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SidebarCiopComponent,
    ReactiveFormsModule,
    SharedModule,
    HttpClientModule
  ],
  standalone: true
})
export class UsuariosComponent implements OnInit {
  profileForm: FormGroup;
  uploading = false;
  usuarios: any[] = [];
  filiais: Filial[] = [];
  gerentes: any[] = [];
  usuarioEditando: Usuario | null = null;

  constructor(
    private fb: FormBuilder,
    private sharedService: SharedService,
    private usuarioService: UsuariosService,
    private router: Router,
    private ngZone: NgZone
  ) {

    this.profileForm = this.fb.group({
      password: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      role: ['', Validators.required],
      filial: ['', Validators.required],
      gerente: ['', Validators.required],
    });
  }

  async ngOnInit() {
    this.carregarUsuarios()
    this.carregarFiliais()
    this.carregarGerentes()
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.carregarGerentes();
        this.carregarUsuarios();
        this.carregarFiliais();
      });
  }

  async carregarUsuarios() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, filial:filial_id ( nome ), gerente:gerente_id ( name )')
      .order('id', { ascending: false });
    if (error) console.error(error);
    else this.usuarios = data || [];
    this.ngZone.run(() => {
      this.usuarios = this.usuarios;
    });
  }

  async carregarFiliais() {
    this.filiais = await this.sharedService.carregarFiliais();
    this.ngZone.run(() => {
      this.filiais = this.filiais;
    });
  }

  async carregarGerentes() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('role', 'moderator');

    if (error) console.error(error);
    else this.gerentes = data || [];
    this.ngZone.run(() => {
      this.gerentes = this.gerentes;
    });
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
        console.log('usuario:', novoUsuario)
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

  async editarUsuario(usuario: Usuario) {
    this.usuarioEditando = usuario;
    this.profileForm.get('email')?.clearValidators();
    this.profileForm.get('password')?.clearValidators();
    this.profileForm.get('email')?.updateValueAndValidity();
    this.profileForm.get('password')?.updateValueAndValidity();

    this.profileForm.patchValue({
      name: usuario.name,
      role: usuario.role,
      filial: usuario.filial_id,
      gerente: usuario.gerente_id
    });
    console.log("editando", this.usuarioEditando)
  }
  salvarEdicao() {
    if (!this.usuarioEditando) return;
    if (this.profileForm.invalid) return;
    console.log("editando", this.usuarioEditando)
    const { name, role, filial, gerente } = this.profileForm.value;
    const usuarioAtualizado = {
      name,
      role,
      filial_id: filial,
      gerente_id: gerente
    };
    this.usuarioService.atualizarUsuario(this.usuarioEditando.id!, usuarioAtualizado)
      .subscribe({
        next: () => {
          this.usuarioEditando = null;
          this.profileForm.reset();
          this.carregarUsuarios();
        },
        error: (err) => console.error('Erro ao atualizar usuário:', err)
      });
  }
  cancelarEdicao() {
    this.usuarioEditando = null;
    this.profileForm.reset();
  }

  excluirUsuario(id: string): void {
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
  testeSubmit() {
    console.log('Form submetido!', this.profileForm.value);
  }
}