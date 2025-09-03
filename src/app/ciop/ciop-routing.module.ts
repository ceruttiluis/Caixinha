import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardCiopComponent } from './dashboard-ciop/dashboard-ciop.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { CiopGuard } from '../guards/ciop.guard';
import { FiliaisComponent } from './Filiais/filiais.component';
import { DashCarteiraComponent } from './dash-carteira/dash-carteira.component';
import { CuponsCiopComponent } from './cupons-ciop/cupons-ciop.component';
import { CarteiraComponent } from './carteira/carteira.component';
import { SolicitacoesComponent } from './solicitacoes/solicitacoes.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardCiopComponent,
    //canActivate: [CiopGuard],
    data: { roles: ['CIOP'] }
  },
  {
    path: 'usuarios',
    component: UsuariosComponent,
    //canActivate: [CiopGuard],
    data: { roles: ['CIOP'] }
  },
  {
    path: 'filiais',
    component: FiliaisComponent,
    //canActivate: [CiopGuard],
    data: { roles: ['CIOP'] }
  },
  {
    path: 'dash-carteira',
    component: DashCarteiraComponent,
    //canActivate: [CiopGuard],
    data: { roles: ['CIOP'] }
  },
  {
    path: 'cupons-ciop',
    component: CuponsCiopComponent,
    //canActivate: [CiopGuard],
    data: { roles: ['CIOP'] }
  },
  {
    path: 'carteira',
    component: CarteiraComponent,
    //canActivate: [CiopGuard],
    data: { roles: ['CIOP'] }
  },
  {
    path: 'solicitacoes',
    component: SolicitacoesComponent,
    //canActivate: [CiopGuard],
    data: { roles: ['CIOP'] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CiopRoutingModule {}