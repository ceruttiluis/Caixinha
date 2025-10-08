import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { SidebarCiopComponent } from '../shared-ciop/sidebar.component';
import { SharedModule } from "../../shared/shared.module";
import { SharedService } from '../../services/shared.service';
import { supabase } from '../../services/supabaseClient';
import { Router, NavigationEnd } from '@angular/router';
import { NgZone } from '@angular/core';
import { filter } from 'rxjs/operators';

interface Filial {
  id?: number;
  nome: string;
  cidade: string;
  gerente?: {
    name: string;
  } | null;
  gerenteID: string;
}

@Component({
  selector: 'app-filiais',
  templateUrl: './filiais.component.html',
  styleUrls: ['./filiais.component.scss'],
  standalone: true,
  imports: [
    SidebarCiopComponent,
    NgFor,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule
  ]
})
export class FiliaisComponent implements OnInit {
  filiais: Filial[] = [];
  novaFilial: Filial = { nome: '', cidade: '', gerenteID: '' };
  editando: Filial | null = null;
  gerentes: any[] = [];
  uploading = false;
  mensagem: string = '';
  mensagemTipo: 'sucesso' | 'erro' | '' = '';

  constructor(
    private router: Router,
    private sharedService: SharedService,
    private ngZone: NgZone) {
  }

  async ngOnInit() {
    await this.carregarFiliais();
    await this.carregarGerentes()
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.carregarFiliais();
      });
  }

  async carregarFiliais() {
    this.filiais = await this.sharedService.carregarFiliais();
    this.ngZone.run(() => {
      this.filiais = this.filiais;
    });
  }
  async salvarFilial() {
    if (this.editando) {
      const { error } = await supabase
        .from('filiais')
        .update({ nome: this.novaFilial.nome, cidade: this.novaFilial.cidade, gerente_id: this.novaFilial.gerenteID })
        .eq('id', this.editando.id);
        this.mostrarMensagem('Filial Atualizada com sucesso', 'sucesso');
      if (!error) {
        this.editando = null;
        this.novaFilial = { nome: '', cidade: '', gerenteID: '' };
        await this.carregarFiliais();
      }
    } else {
      const { error } = await supabase
        .from('filiais')
        .insert([this.novaFilial]);

      if (!error) {
        this.novaFilial = { nome: '', cidade: '', gerenteID: '' };
        await this.carregarFiliais();
      }
      this.mostrarMensagem('Filial cadastrada com sucesso', 'sucesso');
    }
  }

  editarFilial(filial: Filial) {
    this.editando = filial;
    this.novaFilial = { ...filial };
  }

  async excluirFilial(id: number) {
    const { error } = await supabase
      .from('filiais')
      .delete()
      .eq('id', id);

    if (!error) {
      await this.carregarFiliais();
    }
    this.mostrarMensagem('Filial excluida com sucesso', 'sucesso');
  }
  async carregarGerentes() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('role', 'moderator');

    if (error) console.error(error);
    else this.gerentes = data || [];
    this.ngZone.run(() => {
      this.gerentes = this.gerentes;
    });
  }
  mostrarMensagem(texto: string, tipo: 'sucesso' | 'erro') {
    this.mensagem = texto;
    this.mensagemTipo = tipo;
  }
}