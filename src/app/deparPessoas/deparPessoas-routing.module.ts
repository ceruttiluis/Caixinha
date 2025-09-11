import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SolicitacoesDPComponent } from './solicitacoesDP/solicitacoesDP.component';

const routes: Routes = [
  {
    path: '',
    component: SolicitacoesDPComponent,
    //canActivate: [CiopGuard],
    data: { roles: ['DP'] }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DeparPessoasRoutingModule {}