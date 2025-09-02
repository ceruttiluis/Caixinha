import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { SharedModule } from "../../shared/shared.module";
import { SharedService } from '../../shared/shared.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

interface Filial {
  id?: number;
  nome: string;
  cidade: string;
<<<<<<< HEAD
   gerente?: {
    name: string;
  } | null;
=======
>>>>>>> 05a56228f89f7cbc4793218da81cb70fd6f31a9b
}

@Component({
  selector: 'app-filiais',
  templateUrl: './filiais.component.html',
  styleUrls: ['./filiais.component.scss'],
  standalone: true,
  imports: [
    SidebarCiopComponent,
    NgIf,
    NgFor,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule
  ]
})
export class FiliaisComponent implements OnInit {

  constructor(private auth: AuthService, private router: Router, private sharedService: SharedService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }
  supabase: SupabaseClient;
  filiais: Filial[] = [];
<<<<<<< HEAD
  novaFilial: Filial = { nome: '', cidade: ''};
=======
  novaFilial: Filial = { nome: '', cidade: '' };
>>>>>>> 05a56228f89f7cbc4793218da81cb70fd6f31a9b
  editando: Filial | null = null;

  async ngOnInit() {
    await this.carregarFiliais();
  }

  async carregarFiliais() {
    this.filiais = await this.sharedService.carregarFiliais();
  }
  async salvarFilial() {
    if (this.editando) {
      const { error } = await this.supabase
        .from('filiais')
        .update({ nome: this.novaFilial.nome, cidade: this.novaFilial.cidade })
        .eq('id', this.editando.id);

      if (!error) {
        this.editando = null;
<<<<<<< HEAD
        this.novaFilial = { nome: '', cidade: ''};
=======
        this.novaFilial = { nome: '', cidade: '' };
>>>>>>> 05a56228f89f7cbc4793218da81cb70fd6f31a9b
        await this.carregarFiliais();
      }
    } else {
      const { error } = await this.supabase
        .from('filiais')
        .insert([this.novaFilial]);

      if (!error) {
<<<<<<< HEAD
        this.novaFilial = { nome: '', cidade: ''};
=======
        this.novaFilial = { nome: '', cidade: '' };
>>>>>>> 05a56228f89f7cbc4793218da81cb70fd6f31a9b
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