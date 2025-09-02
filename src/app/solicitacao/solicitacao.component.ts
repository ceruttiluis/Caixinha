import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { SharedModule } from '../shared/shared.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lancar-cupom',
  templateUrl: './solicitacao.component.html',
  styleUrls: ['./solicitacao.component.scss'],
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule, CommonModule]
})
export class SolicitacaoComponent {
  solicitacaoForm: FormGroup;
  supabase: SupabaseClient;
  preview: string = '';
  uploading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService
  ) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    this.solicitacaoForm = this.fb.group({
      tipo: ['', Validators.required],
      observacoes: ['', Validators.required],
      data: [new Date().toISOString().split('T')[0], Validators.required],
      valor: ['', Validators.required],
    });
  }

  async enviarCupom(): Promise<void> {
    if (this.solicitacaoForm.invalid) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    this.uploading = true;
    const { tipo, observacoes, data, valor } = this.solicitacaoForm.value;

    const { data: perfil, error: perfilError } = await this.supabase
      .from('profiles')
      .select('filial_id')
      .eq('id', this.auth.getUserId())
      .single();

    if (perfilError || !perfil?.filial_id) {
      alert('Erro: não foi possível encontrar a filial do usuário.');
      this.uploading = false;
      return;
    }

    const { error: insertError } = await this.supabase
      .from('solicitacao')
      .insert({
        profile_id: this.auth.getUserId(),
        filial_id: perfil.filial_id,
        tipo_recarga: tipo,
        observacoes: observacoes,
        data_solicitacao: data,
        valor: parseFloat(valor)
      });

    if (insertError) {
      alert('Erro ao salvar cupom: ' + insertError.message);
    } else {
      alert('Solicitação enviado com sucesso!');
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
}