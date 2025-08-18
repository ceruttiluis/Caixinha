import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { SharedModule } from '../../shared/shared.module';

interface User {
  id?: number;
  name: string;
  email: string;
  carteira: number;
}

@Component({
  selector: 'app-usuarios',
  templateUrl: './carteira.component.html',
  styleUrls: ['./carteira.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule, SidebarCiopComponent, SharedModule],
  standalone: true
})
export class CarteiraComponent implements OnInit {
  supabase: SupabaseClient;
  users: User[] = [];
  novoUsuario: User = { name: '', email: '', carteira: 0};
  editando: User | null = null;
  userInEdit: number | null = null;
  editValue: number = 0;
  message: string = '';
  isError: boolean = false;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async ngOnInit() {
    this.carregarUsuarios();
  }

  async carregarUsuarios() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .order('id', { ascending: false });

    if (error) console.error(error);
    else this.users = data || [];
  }
  async salvarCarteira() {
    if (this.editando) {
      const { error } = await this.supabase
        .from('profiles')
        .update({ nome: this.novoUsuario.name, })
        .eq('id', this.editando.id);

      if (!error) {
        this.editando = null;
        this.novoUsuario = { name: '', email: '', carteira: 0};
        await this.carregarUsuarios();
      }
    } else {
      const { error } = await this.supabase
        .from('profiles')
        .insert([this.novoUsuario]);

      if (!error) {
        this.novoUsuario = { name: '', email: '', carteira: 0};
        await this.carregarUsuarios();
      }
    }
  }

  editarCarteira(users: User) {
    this.editando = users;
    this.novoUsuario = { ...users };
  }

  cancelarEdicao() {
  this.editando = null;
  this.novoUsuario = { name: '', email: '', carteira: 0 };
  }

   async atualizarCarteira(user: User): Promise<void> {
    if (isNaN(this.editValue)) {
      this.showMessage('Valor inválido!', true);
      return;
    }

    try {
      const { error } = await this.supabase
        .from('profiles')
        .update({ carteira: this.editValue })
        .eq('id', user.id);

      if (error) throw error;

      this.showMessage('Carteira atualizada com sucesso!');
      this.userInEdit = null;
      await this.carregarUsuarios();
    } catch (error) {
      this.showMessage('Erro ao atualizar carteira', true);
      console.error('Erro:', error);
    }
  }
  private showMessage(msg: string, isError: boolean = false): void {
    this.message = msg;
    this.isError = isError;
    setTimeout(() => this.message = '', 5000);
  }
}
    