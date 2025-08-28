import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarGerenteComponent } from '../shared-gerente/sidebar.component';
import { SharedModule } from '../../shared/shared.module';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usu-gerente.component.html',
  styleUrls: ['./usu-gerente.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule, SidebarGerenteComponent, SharedModule],
  standalone: true
})
export class UsuariosGerenteComponent implements OnInit {
  supabase: SupabaseClient;
  usuarios: any[] = [];
  filialSelecionada: string = '';
  filialId: string | null = null;
  novoUsuario = { name: '', email: '', role: '', filial_nome: '' };

  constructor(private auth: AuthService, private router: Router) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async ngOnInit() {
    this.filialId = this.auth.getFilialId();
    this.carregarUsuarios();
  }

  async carregarUsuarios() {
    const filtro = this.filialSelecionada || this.filialId;

    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, name, email, role, filial:filial_id ( id, nome, cidade ), gerente:gerente_id ( id, name )')
      .order('id', { ascending: false });
    if (error) console.error(error);
    else this.usuarios = data || [];
  }
}