import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { SharedModule } from '../../shared/shared.module';
import { AuthService } from '../../services/auth.service';

interface User {
  id?: number;
  name: string;
  email: string;
  carteira: number;
  incremento?: number; 
}

@Component({
  selector: 'app-usuarios',
  templateUrl: './carteira.component.html',
  styleUrls: ['./carteira.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule, SidebarCiopComponent, SharedModule, ReactiveFormsModule],
  standalone: true
})
export class CarteiraComponent implements OnInit {
  supabase: SupabaseClient;
  users: User[] = [];
  novoUsuario: User = { name: '', email: '', carteira: 0};
  selectedUser: User | null = null;
  editando: User | null = null;
  message: string = '';
  isError: boolean = false;
  carteiraForm: FormGroup;
   uploading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService) 
    { this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
      this.carteiraForm = this.fb.group({
      usuarioId: ['', Validators.required],
      observacoes: [''],
      valor: ['', [Validators.required, Validators.min(0.01)]]
    });
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

  async atualizarCarteira(user: User) {
    if (!user.incremento || user.incremento === 0) {
      this.showMessage('Informe um valor para atualizar o saldo!', true);
      return;
    }

    const novoSaldo = user.carteira + user.incremento;

    const { data, error } = await this.supabase
      .from('profiles')
      .update({ carteira: novoSaldo })
      .eq('id', user.id)
      .select();

    if (error) {
      console.error('Erro ao atualizar carteira:', error);
      this.showMessage('Erro ao atualizar carteira!', true);
    } else {
      user.carteira = novoSaldo;
      user.incremento = 0;
      this.showMessage('Saldo atualizado com sucesso!');
    }
  }

  async enviarSaldo(): Promise<void> {
    if (this.carteiraForm.invalid) {
      this.showMessage('Preencha todos os campos obrigatórios!', true);
      return;
    }

    this.uploading = true;
    
    const { usuarioId, observacoes, valor } = this.carteiraForm.value;
    const valorNumerico = parseFloat(valor);

    try {
      const { data: usuario, error: usuarioError } = await this.supabase
        .from('profiles')
        .select('carteira, filial_id, name')
        .eq('id', usuarioId)
        .single();

      if (usuarioError || !usuario) {
        throw new Error('Usuário não encontrado!');
      }

      if (!usuario.filial_id) {
        throw new Error('Usuário não possui filial cadastrada!');
      }

      const novoSaldo = (usuario.carteira || 0) + valorNumerico;

      const { error: updateError } = await this.supabase
        .from('profiles')
        .update({ carteira: novoSaldo })
        .eq('id', usuarioId);

      if (updateError) {
        throw new Error('Erro ao atualizar saldo: ' + updateError.message);
      }

      const historicoData = {
        profile_id: usuarioId,
        filial_id: usuario.filial_id,
        observacoes: observacoes || 'Recarga de saldo',
        valor_add: valorNumerico,
        criado_em: new Date().toISOString(),
      };

      const { error: insertError } = await this.supabase
        .from('carteira') 
        .insert(historicoData);

      if (insertError) {
        throw new Error('Erro ao registrar histórico: ' + insertError.message);
      }

      const userIndex = this.users.findIndex(u => u.id === usuarioId);
      if (userIndex !== -1) {
        this.users[userIndex].carteira = novoSaldo;
      }

      this.carteiraForm.reset({
        usuarioId: '',
        observacoes: '',
        valor: ''
      });
      
      this.selectedUser = null;
      this.showMessage(`Saldo de R$ ${valorNumerico.toFixed(2)} adicionado com sucesso para o usuário!`);

    } catch (error: any) {
      console.error('Erro ao processar recarga:', error);
      this.showMessage(error.message || 'Erro ao processar a recarga de saldo!', true);
    } finally {
      this.uploading = false;
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

  private showMessage(msg: string, isError: boolean = false): void {
    this.message = msg;
    this.isError = isError;
    setTimeout(() => this.message = '', 4000);
  }
}
    