import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CiopRoutingModule } from './ciop-routing.module';
import { SharedModule } from '../shared/shared.module';
import { DashboardCiopComponent } from './dashboard-ciop/dashboard-ciop.component';
import { UsuariosComponent } from './crud-usuarios/usuarios.component';
import { SidebarCiopComponent } from './shared-ciop/sidebar.component';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    RouterModule,
    CiopRoutingModule,
    SharedModule,
    DashboardCiopComponent,
    UsuariosComponent,
    SidebarCiopComponent
  ]
})
export class CiopModule { }