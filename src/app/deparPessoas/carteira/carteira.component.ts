import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { supabase } from '../../services/supabaseClient';
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
  users: any[] = [];
  selectedUser: User | null = null;
  message: string = '';
  isError: boolean = false;
  carteiraForm: FormGroup;
  estadoMensagem: '' | 'loading' | 'sucesso' | 'erro' = '';
  mensagem: string = '';
  uploading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone) {
    this.carteiraForm = this.fb.group({
      usuarioId: ['', Validators.required],
      tipo: ['', Validators.required],
      observacoes: [''],
      valor: ['', [Validators.required, Validators.min(0.01)]]
    });
  }

  async ngOnInit() {
   await this.carregarUsuarios();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.carregarUsuarios();
      });
  }

  async carregarUsuarios() {
    const { data, error } = await supabase
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
      this.mostrarMensagem('Preencha todos os campos obrigatórios!', 'erro');
      return;
    }

    this.estadoMensagem = 'loading';
    this.mensagem = 'Processando...';

    const { usuarioId, observacoes, valor, tipo } = this.carteiraForm.value;

    const valorNumerico = parseFloat(String(valor).replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      this.mostrarMensagem('Valor inválido!', 'erro');
      return;
    }

    try {
      const { data: usuario, error: usuarioError } = await supabase
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

      const { error: updateError } = await supabase
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

      const { error: insertError } = await supabase
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
      this.mostrarMensagem(
        `${isRemocao ? 'Removido' : 'Adicionado'} R$ ${Math.abs(valorNumerico).toFixed(2)} ${isRemocao ? 'da' : 'à'} carteira do usuário com sucesso!`,
        'sucesso'
      );

    } catch (error: any) {
      console.error('Erro ao processar recarga:', error);
      this.mostrarMensagem(error.message || 'Erro ao processar a recarga de saldo!', 'erro');
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

  mostrarMensagem(msg: string, tipo: 'sucesso' | 'erro') {
    this.mensagem = msg;
    this.estadoMensagem = tipo;

    setTimeout(() => {
      this.ngZone.run(() => {
        this.estadoMensagem = '';
        this.mensagem = '';
      });
      this.cdr.detectChanges();
    }, 2000);
  }
}
