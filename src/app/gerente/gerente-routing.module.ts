import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardGerenteComponent } from './dashboard-gerente/dashboard-gerente.component';
import { UsuariosGerenteComponent } from './usuarios-gerente/usu-gerente.component';
import { CuponsComponent } from './cupons/cupons.component';
import { GerenteGuard } from '../guards/gerente.guard';
import { RecargaComponent } from './recarga/recarga.component';

const routes: Routes = [
  {
      path: '',
      component: DashboardGerenteComponent,
      canActivate: [GerenteGuard],
      data: { roles: ['GERENTE'] }
    },
    {
      path: 'usuarios-gerente',
      component: UsuariosGerenteComponent,
      canActivate: [GerenteGuard],
      data: { roles: ['GERENTE'] }
    },
    {
      path: 'cupons',
      component: CuponsComponent,
      canActivate: [GerenteGuard],
      data: { roles: ['GERENTE'] }
    },
    {
      path: 'recarga',
      component: RecargaComponent,
      canActivate: [GerenteGuard],
      data: { roles: ['GERENTE'] }
    },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GerenteRoutingModule { }