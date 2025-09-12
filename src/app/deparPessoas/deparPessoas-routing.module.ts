import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SolicitacoesDPComponent } from './solicitacoesDP/solicitacoesDP.component';
import { CarteiraComponent } from './carteira/carteira.component';

const routes: Routes = [
  {
    path: '',
    component: SolicitacoesDPComponent,
    //canActivate: [CiopGuard],
    data: { roles: ['DP'] }
  },
  {
    path: 'carteira',
    component: CarteiraComponent,
    //canActivate: [CiopGuard],
    data: { roles: ['CIOP'] }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DeparPessoasRoutingModule { }