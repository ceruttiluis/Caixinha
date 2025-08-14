import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lancar-cupom',
  templateUrl: './lancar-cupom.component.html',
  styleUrls: ['./lancar-cupom.component.scss'],
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule, CommonModule]
})
export class LancarCupomComponent {
  cupomForm: FormGroup;
  supabase: SupabaseClient;
  imageUrl: string = '';
  preview: string = '';
  uploading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService
  ) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

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
    alert('Preencha todos os campos obrigatórios!');
    return;
  }

  this.uploading = true;
  const file: File = this.cupomForm.value.imagem;
  const filePath = `cupons/${Date.now()}-${file.name}`;

  // Upload para o bucket "cupons"
  const { error: uploadError } = await this.supabase
    .storage
    .from('cupons')
    .upload(filePath, file);

  if (uploadError) {
    alert('Erro ao enviar imagem: ' + uploadError.message);
    this.uploading = false;
    return;
  }

  const imageUrl = `${environment.supabaseUrl}/storage/v1/object/public/cupons/${filePath}`;

  const { tipo, observacoes, data, valor } = this.cupomForm.value;

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
      alert('Erro ao salvar cupom: ' + insertError.message);
    } else {
      alert('Cupom enviado com sucesso!');
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
}