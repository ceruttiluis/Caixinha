import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule, SidebarCiopComponent, SharedModule],
  standalone: true
})
export class UsuariosComponent implements OnInit {
  supabase: SupabaseClient;
  usuarios: any[] = [];
  novoUsuario = { nome: '', email: '', role: 'colaborador', filial_id: '' };

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async ngOnInit() {
    const { data } = await this.supabase.from('usuarios').select('*');
    this.usuarios = data || [];
  }

  async criarUsuario() {
    const { error } = await this.supabase.from('usuarios').insert([this.novoUsuario]);
    if (!error) {
      this.novoUsuario = { nome: '', email: '', role: 'colaborador', filial_id: '' };
      await this.ngOnInit();
    }
  }

  async excluirUsuario(id: string) {
    await this.supabase.from('usuarios').delete().eq('id', id);
    await this.ngOnInit();
  }
}