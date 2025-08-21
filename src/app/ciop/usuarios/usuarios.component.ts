import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup, Validators, ReactiveFormsModule, FormBuilder} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { SharedModule } from '../../shared/shared.module';

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
  Filiais: Filial[] = [];
  gerentes: any[] = [];

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    this.profileForm = this.fb.group({
      password: ['', Validators.required],
      email: ['', Validators.required],
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
  }

  async carregarUsuarios() {
    const { data, error } = await this.supabase
        .from('profiles')
        .select('id, name, email, role, filial:filial_id ( id, nome, cidade ), gerente:gerente_id ( id, name )')
        .order('id', { ascending: false });

        if (error) console.error(error);
        else this.usuarios = data || [];
  }

  async carregarFiliais() {
    const { data, error } = await this.supabase
        .from('filiais')
        .select('id, nome, cidade')
        .order('id', { ascending: false });

        if (error) console.error(error);
        else this.Filiais = data || [];
  }

  async carregarGerentes() {
  const { data, error } = await this.supabase
    .from('profiles')
    .select('id, name, role')
    .eq('role', 'moderator');

  if (error) console.error(error);
  else this.gerentes = data || [];
}
  
  async criarUsuario(): Promise<void>{
    this.uploading = true;

    const { email, name, role, filial, gerente, password } = this.profileForm.value;

    const { data: authUser, error: authError } = await this.supabase.auth.admin.createUser({
    email,
    password, 
    email_confirm: true,
  });

  if (authError) {
    console.error('Erro ao criar usuário no Auth:', authError.message);
    this.uploading = false;
    return;
  }

    const novoUsuario = {
      id: authUser.user.id, 
      email,
      name,
      role,
      filial_id: filial,
      carteira: 0,
      gerente_id: gerente,
    };

    const { error } = await this.supabase
      .from('profiles')
      .insert(novoUsuario);

     if (error) {
    console.error('Erro ao registrar novo usuario: ' + error.message);
  } else {
    console.log('Usuário criado com sucesso!');
    this.carregarUsuarios();
  }

  this.uploading = false;
  }

  async excluirUsuario(id: string) {
    await this.supabase.from('profiles').delete().eq('id', id);
    await this.ngOnInit();
  }
}