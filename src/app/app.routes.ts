import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { ColaboradorGuard } from './guards/colaborador.guard';
import { GerenteGuard } from './guards/gerente.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
     path: 'ciop',
     loadChildren: () => import('./ciop/ciop.module').then(m => m.CiopModule),
   },
   {
       path: 'colaborador',
       loadChildren: () => import('./colaborador/colaborador.module').then(m => m.ColaboradorModule)
     },
     {
       path: 'gerente',
       loadChildren: () => import('./gerente/gerente.module').then(m => m.GerenteModule)
     },
];