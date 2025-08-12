import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { createClient } from '@supabase/supabase-js';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

interface Filial {
  id?: number;
  nome: string;
  cidade: string;
}

const supabase = createClient(
  'https://cbymtecijykciwtmpglp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNieW10ZWNpanlrY2l3dG1wZ2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMDQ4MTMsImV4cCI6MjA2ODY4MDgxM30.nLtn39vpwUcUmdPQnfqeNGWPku_C5EdpR1magZC9RQ4'
);

@Component({
  selector: 'app-filiais',
  templateUrl: './filiais.component.html',
  styleUrls: ['./filiais.component.scss'],
  standalone: true,
  imports:[
    NgIf,
    NgFor,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
]
})
export class FiliaisComponent implements OnInit {
  supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

  filiais: Filial[] = [];
  novaFilial: Filial = { nome: '', cidade: '' };
  editando: Filial | null = null;

  async ngOnInit() {
    await this.carregarFiliais();
  }

  async carregarFiliais() {
    const { data, error } = await this.supabase
      .from('filiais')
      .select('*')
      .order('id', { ascending: false });

    if (error) console.error(error);
    else this.filiais = data || [];
  }

  async salvarFilial() {
    if (this.editando) {
      const { error } = await this.supabase
        .from('filiais')
        .update({ nome: this.novaFilial.nome, cidade: this.novaFilial.cidade })
        .eq('id', this.editando.id);

      if (!error) {
        this.editando = null;
        this.novaFilial = { nome: '', cidade: '' };
        await this.carregarFiliais();
      }
    } else {
      const { error } = await this.supabase
        .from('filiais')
        .insert([this.novaFilial]);

      if (!error) {
        this.novaFilial = { nome: '', cidade: '' };
        await this.carregarFiliais();
      }
    }
  }

  editarFilial(filial: Filial) {
    this.editando = filial;
    this.novaFilial = { ...filial };
  }

  async excluirFilial(id: number) {
    const { error } = await this.supabase
      .from('filiais')
      .delete()
      .eq('id', id);

    if (!error) {
      await this.carregarFiliais();
    }
  }
}