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
      descricao: [''],
      data: [new Date().toISOString().split('T')[0], Validators.required],
      valor: ['', Validators.required],
      imagem: [null, Validators.required]
    });
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    this.cupomForm.patchValue({ imagem: file });

    const reader = new FileReader();
    reader.onload = () => (this.preview = reader.result as string);
    reader.readAsDataURL(file);
  }

  async enviarCupom(): Promise<void> {
    if (this.cupomForm.invalid) return;

    this.uploading = true;
    const file = this.cupomForm.value.imagem;
    const filePath = `cupons/${Date.now()}-${file.name}`;

    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('cupons')
      .upload(filePath, file);

    if (uploadError) {
      alert('Erro ao enviar imagem');
      this.uploading = false;
      return;
    }

    const imageUrl = `${environment.supabaseUrl}/storage/v1/object/public/cupons/${filePath}`;
    const { tipo, descricao, data, valor } = this.cupomForm.value;

    const { error: insertError } = await this.supabase.from('cupons').insert({
      usuario_id: this.auth.getUserId(),
      tipo_gasto: tipo,
      descricao_outros: tipo === 'Outros' ? descricao : null,
      data_nota: data,
      valor: parseFloat(valor),
      url_imagem: imageUrl
    });

    if (insertError) {
      alert('Erro ao salvar cupom');
    } else {
      alert('Cupom enviado com sucesso!');
      this.cupomForm.reset();
      this.preview = '';
    }

    this.uploading = false;
  }
}