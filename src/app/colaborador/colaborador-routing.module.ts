import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ColaboradorGuard } from '../guards/colaborador.guard';
import { CuponsColaboradorComponent } from './cupons-colaborador/cupons-colaborador.component';
import { DashColaboradorComponent } from './dash-colaborador/dash-colaborador.component';

const routes: Routes = [
  {
    path: '',
    component: DashColaboradorComponent,
    //canActivate: [ColaboradorGuard],
    data: { roles: ['COLABORADOR'] }
  },
  {
    path: 'cupons-colaborador',
    component: CuponsColaboradorComponent,
    //canActivate: [ColaboradorGuard],
    data: { roles: ['COLABORADOR'] }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ColaboradorRoutingModule {}