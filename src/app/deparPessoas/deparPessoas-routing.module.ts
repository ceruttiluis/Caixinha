import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SolicitacoesDPComponent } from './solicitacoesDP/solicitacoesDP.component';
import { CarteiraComponent } from './carteira/carteira.component';
import { DPGuard } from '../guards/dp.guard';

const routes: Routes = [
  {
    path: '',
    component: SolicitacoesDPComponent,
    canActivate: [DPGuard],
    data: { roles: ['DP'] }
  },
  {
    path: 'carteira',
    component: CarteiraComponent,
    canActivate: [DPGuard],
    data: { roles: ['DP'] }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DeparPessoasRoutingModule { }