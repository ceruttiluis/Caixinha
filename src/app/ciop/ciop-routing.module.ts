import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
<<<<<<< HEAD
=======

>>>>>>> 05a56228f89f7cbc4793218da81cb70fd6f31a9b
import { DashboardCiopComponent } from './dashboard-ciop/dashboard-ciop.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { CiopGuard } from '../guards/ciop.guard';
import { FiliaisComponent } from './Filiais/filiais.component';
<<<<<<< HEAD
import { DashCarteiraComponent } from './dash-carteira/dash-carteira.component';
import { CuponsCiopComponent } from './cupons-ciop/cupons-ciop.component';
import { CarteiraComponent } from './carteira/carteira.component';
import { SolicitacoesComponent } from './solicitacoes/solicitacoes.component';
=======
>>>>>>> 05a56228f89f7cbc4793218da81cb70fd6f31a9b

const routes: Routes = [
  {
    path: '',
    component: DashboardCiopComponent,
<<<<<<< HEAD
    //canActivate: [CiopGuard],
=======
    canActivate: [CiopGuard],
>>>>>>> 05a56228f89f7cbc4793218da81cb70fd6f31a9b
    data: { roles: ['CIOP'] }
  },
  {
    path: 'usuarios',
    component: UsuariosComponent,
<<<<<<< HEAD
    //canActivate: [CiopGuard],
=======
    canActivate: [CiopGuard],
>>>>>>> 05a56228f89f7cbc4793218da81cb70fd6f31a9b
    data: { roles: ['CIOP'] }
  },
  {
    path: 'filiais',
    component: FiliaisComponent,
<<<<<<< HEAD
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
=======
    canActivate: [CiopGuard],
>>>>>>> 05a56228f89f7cbc4793218da81cb70fd6f31a9b
    data: { roles: ['CIOP'] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CiopRoutingModule {}