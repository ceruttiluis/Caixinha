import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LancarCupomComponent } from './lancar-cupom/lancar-cupom.component';
import { ColaboradorGuard } from '../guards/colaborador.guard';

const routes: Routes = [
  {
    path: '',
    component: LancarCupomComponent,
    canActivate: [ColaboradorGuard],
    data: { roles: ['COLABORADOR'] }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ColaboradorRoutingModule {}