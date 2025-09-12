import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, NavigationEnd, Router } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { NgZone } from '@angular/core';
import { filter } from 'rxjs/operators';
import { SidebarDPComponent } from "../sharedDP/sidebarDP.component";

interface User {
  id?: number;
  name: string;
  email: string;
  carteira: number;
  incremento?: number;
  filial?: {
    nome: string;
  } | null;
}

@Component({
  selector: 'app-usuarios',
  templateUrl: './carteira.component.html',
  styleUrls: ['./carteira.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule, SidebarDPComponent, SharedModule, ReactiveFormsModule, SidebarDPComponent],
  standalone: true
})
export class CarteiraComponent implements OnInit {
  supabase: SupabaseClient;
  users: any[] = [];
  selectedUser: User | null = null;
  message: string = '';
  isError: boolean = false;
  carteiraForm: FormGroup;
  uploading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private ngZone: NgZone) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.carteiraForm = this.fb.group({
      usuarioId: ['', Validators.required],
      tipo: ['', Validators.required],
      observacoes: [''],
      valor: ['', [Validators.required, Validators.min(0.01)]]
    });
  }

  async ngOnInit() {
    this.carregarUsuarios();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.carregarUsuarios();
      });
  }

  async carregarUsuarios() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, name, email, filial:filial_id ( nome ), carteira')
      .order('id', { ascending: false });
    if (error) console.error(error);
    else this.users = data || [];
    this.ngZone.run(() => {
      this.users = this.users;
    });
  }

  async enviarSaldo(): Promise<void> {
    if (this.carteiraForm.invalid) {
      this.showMessage('Preencha todos os campos obrigatórios!', true);
      return;
    }

    this.uploading = true;

    const { usuarioId, observacoes, valor, tipo } = this.carteiraForm.value;

    const valorNumerico = parseFloat(String(valor).replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      this.showMessage('Valor inválido!', true);
      this.uploading = false;
      return;
    }

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

      const isRemocao = String(tipo || '').toLowerCase().includes('remov');
      const valorAplicado = isRemocao ? -Math.abs(valorNumerico) : Math.abs(valorNumerico);

      const novoSaldo = (usuario.carteira ?? 0) + valorAplicado;

      if (novoSaldo < 0) {
        throw new Error('Saldo insuficiente para remover este valor!');
      }

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
        tipo_recarga: tipo || (isRemocao ? 'Remoção de saldo' : 'Recarga de saldo'),
        observacoes: observacoes || 'Recarga de saldo',
        valor_add: valorAplicado,
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
      this.showMessage(
      `${isRemocao ? 'Removido' : 'Adicionado'} R$ ${Math.abs(valorNumerico).toFixed(2)} ${isRemocao ? 'da' : 'à'} carteira do usuário com sucesso!`
    );

    } catch (error: any) {
      console.error('Erro ao processar recarga:', error);
      this.showMessage(error.message || 'Erro ao processar a recarga de saldo!', true);
    } finally {
      this.uploading = false;
    }
  }

  cancelarEdicao() {
    this.carteiraForm.reset({
      usuarioId: '',
      tipo: '',
      observacoes: '',
      valor: ''
    });
  }

  private showMessage(msg: string, isError: boolean = false): void {
    this.message = msg;
    this.isError = isError;
    setTimeout(() => this.message = '', 4000);
  }
}
