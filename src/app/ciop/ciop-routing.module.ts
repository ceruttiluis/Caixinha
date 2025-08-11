import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Standalone components
import { DashboardCiopComponent } from './dashboard-ciop/dashboard-ciop.component';
import { UsuariosComponent } from './crud-usuarios/usuarios.component';
import { CiopGuard } from '../guards/ciop.guard';
import { FiliaisComponent } from './Filiais/filiais.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardCiopComponent,
    canActivate: [CiopGuard],
    data: { roles: ['CIOP'] }
  },
  {
    path: 'usuarios',
    component: UsuariosComponent,
    canActivate: [CiopGuard],
    data: { roles: ['CIOP'] }
  },
  {
    path: 'filiais',
    component: FiliaisComponent,
    canActivate: [CiopGuard],
    data: { roles: ['CIOP'] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CiopRoutingModule {}