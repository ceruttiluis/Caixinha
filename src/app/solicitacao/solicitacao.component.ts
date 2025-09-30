import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { SharedModule } from '../shared/shared.module';
import { supabase } from '../services/supabaseClient';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lancar-cupom',
  templateUrl: './solicitacao.component.html',
  styleUrls: ['./solicitacao.component.scss'],
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule, CommonModule]
})
export class SolicitacaoComponent {
  solicitacaoForm: FormGroup;
  preview: string = '';
  uploading = false;
  mensagem: string = '';
  mensagemTipo: 'sucesso' | 'erro' | '' = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.solicitacaoForm = this.fb.group({
      tipo: ['', Validators.required],
      observacoes: ['', Validators.required],
      data: [new Date().toISOString().split('T')[0], Validators.required],
      valor: ['', Validators.required],
    });
  }

  async enviarCupom(): Promise<void> {
    if (this.solicitacaoForm.invalid) {
      this.mostrarMensagem('Preencha todos os campos obrigatórios!', 'erro');
      return;
    }

    this.uploading = true;
    const { tipo, observacoes, data, valor } = this.solicitacaoForm.value;

    const { data: perfil, error: perfilError } = await supabase
      .from('profiles')
      .select('filial_id')
      .eq('id', this.auth.getUserId())
      .single();

    if (perfilError || !perfil?.filial_id) {
      this.mostrarMensagem('Erro: não foi possível encontrar a filial do usuário.', 'erro');
      this.uploading = false;
      return;
    }

    const { error: insertError } = await supabase
      .from('recarga')
      .insert({
        profile_id: this.auth.getUserId(),
        filial_id: perfil.filial_id,
        tipo_recarga: tipo,
        observacoes: observacoes,
        data_solicitacao: data,
        valor: parseFloat(valor)
      });

    if (insertError) {
      this.mostrarMensagem('Erro ao enviar Solicitação de Recarga' + insertError.message, 'erro');
    } else {
      this.mostrarMensagem('✅ Solicitação enviada com sucesso!', 'sucesso');
      this.solicitacaoForm.reset({
        tipo: '',
        observacoes: '',
        data: new Date().toISOString().split('T')[0],
        valor: '',
        imagem: null
      });
      this.preview = '';
    }

    this.uploading = false;
  }
  selectOption(option: string): void {
    if (option === 'home') {
      this.router.navigate(['/home']);
    }
  }
  mostrarMensagem(texto: string, tipo: 'sucesso' | 'erro') {
    this.mensagem = texto;
    this.mensagemTipo = tipo;
  }
}