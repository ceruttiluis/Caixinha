import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { supabase } from '../../services/supabaseClient';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { SidebarGerenteComponent } from '../shared-gerente/sidebar.component';
import { SharedModule } from '../../shared/shared.module';
import { AuthService } from '../../services/auth.service';
import { NgZone } from '@angular/core';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usu-gerente.component.html',
  styleUrls: ['./usu-gerente.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule, SidebarGerenteComponent, SharedModule],
  standalone: true
})
export class UsuariosGerenteComponent implements OnInit {
  usuarios: any[] = [];
  filialSelecionada: string = '';
  filialId: string | null = null;

  constructor(
    private auth: AuthService, 
    private router: Router,
    private ngZone: NgZone
  ) {}

  async ngOnInit() {
    this.filialId = this.auth.getFilialId();
    this.carregarUsuarios();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.carregarUsuarios();
      });
  }

  async carregarUsuarios() {
    const filtro = this.filialSelecionada || this.filialId;
    let query = supabase
      .from('profiles')
      .select('id, name, email, role, filial:filial_id ( nome )')
      .order('id', { ascending: false });
       if (filtro) {
      query = query.eq('filial_id', filtro);
    }
       const { data, error } = await query;
    if (error) console.error(error);
    else this.usuarios = data || [];
     this.ngZone.run(() => {
      this.usuarios = this.usuarios;
    });
  }
}