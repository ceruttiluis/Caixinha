import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LancarCupomComponent } from './lancar-cupom/lancar-cupom.component';
import { MinhasSolicitacoesComponent } from './solicitacoes/minhas-solicitacoes.component';

const routes: Routes = [
  { path: '', component: LancarCupomComponent },
  { path: 'minhas-solicitacoes', component: MinhasSolicitacoesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ColaboradorRoutingModule {}