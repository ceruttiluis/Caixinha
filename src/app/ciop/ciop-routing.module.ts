import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardCiopComponent } from './dashboard-ciop/dashboard-ciop.component';
import { UsuariosComponent } from './crud-usuarios/usuarios.component';


const routes: Routes = [
  { path: '', component: DashboardCiopComponent },
  { path: 'usuarios', component: UsuariosComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CiopRoutingModule {}
