import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { supabase } from '../services/supabaseClient';
import { environment } from '../../environments/environment';
import { SharedModule } from '../shared/shared.module';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lancar-cupom',
  templateUrl: './lancar-cupom.component.html',
  styleUrls: ['./lancar-cupom.component.scss'],
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule, CommonModule]
})
export class LancarCupomComponent {
  cupomForm: FormGroup;
  imageUrl: string = '';
  preview: string = '';
  uploading = false;
  mensagem: string = '';
  mensagemTipo: 'sucesso' | 'erro' | '' = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.cupomForm = this.fb.group({
      tipo: ['', Validators.required],
      observacoes: ['', Validators.required],
      data: [new Date().toISOString().split('T')[0], Validators.required],
      valor: ['', Validators.required],
      imagem: [null, Validators.required]
    });
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.cupomForm.patchValue({ imagem: file });
    this.cupomForm.get('imagem')?.updateValueAndValidity();

    const reader = new FileReader();
    reader.onload = () => (this.preview = reader.result as string);
    reader.readAsDataURL(file);
  }

  async enviarCupom(): Promise<void> {
    if (this.cupomForm.invalid) {
      this.mostrarMensagem('Preencha todos os campos obrigatórios!', 'erro');
      return;
    }

    this.uploading = true;
    const file: File = this.cupomForm.value.imagem;
    const filePath = `cupons/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase
      .storage
      .from('cupons')
      .upload(filePath, file);

    if (uploadError) {
      this.mostrarMensagem('Erro ao enviar imagem: ' + uploadError.message, 'erro');
      this.uploading = false;
      return;
    }

    const imageUrl = `${environment.supabaseUrl}/storage/v1/object/public/cupons/${filePath}`;

    const { tipo, observacoes, data, valor } = this.cupomForm.value;

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
      .from('cupons')
      .insert({
        usuario_id: this.auth.getUserId(),
        filial_id: perfil.filial_id,
        tipo_gasto: tipo,
        observacoes: observacoes,
        data_nota: data,
        valor: parseFloat(valor),
        url_imagem: imageUrl
      });

    if (insertError) {
      this.mostrarMensagem('Erro ao salvar cupom: ' + insertError.message, 'erro');
    } else {
      this.mostrarMensagem('✅ Cupom enviado com sucesso!', 'sucesso');
      this.cupomForm.reset({
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