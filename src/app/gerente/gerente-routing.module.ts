import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardGerenteComponent } from './dashboard-gerente/dashboard-gerente.component';

const routes: Routes = [
  { path: '', component: DashboardGerenteComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GerenteRoutingModule {}