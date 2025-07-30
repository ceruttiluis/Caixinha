import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';

import { CiopGuard } from './guards/ciop.guard';
import { GerenteGuard } from './guards/gerente.guard';
import { ColaboradorGuard } from './guards/colaborador.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'colaborador',
    canActivate: [ColaboradorGuard],
    loadChildren: () => import('./colaborador/colaborador.module').then(m => m.ColaboradorModule)
  },
  {
    path: 'gerente',
    canActivate: [GerenteGuard],
    loadChildren: () => import('./gerente/gerente.module').then(m => m.GerenteModule)
  },
  {
    path: 'ciop',
    canActivate: [CiopGuard],
    loadChildren: () => import('./ciop/ciop.module').then(m => m.CiopModule)
  },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}