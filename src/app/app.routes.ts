import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { FiliaisComponent } from './ciop/Filiais/filiais.component';
import { UsuariosComponent } from './ciop/usuarios/usuarios.component';
import { HomeGerenteComponent } from './gerente/home-gerente/home-gerente.component';
import { CuponsComponent } from './gerente/cupons/cupons.component';
import { CuponsCiopComponent } from './ciop/cupons-ciop/cupons-ciop.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'ciop',
    loadChildren: () => import('./ciop/ciop.module').then(m => m.CiopModule)
  },
  { path: 'filiais', component: FiliaisComponent },
  { path: 'usuarios', component: UsuariosComponent },
  { path: 'cupons-ciop', component: CuponsCiopComponent },
  {
    path: 'colaborador',
    loadChildren: () => import('./colaborador/colaborador.module').then(m => m.ColaboradorModule)
  },
  {
    path: 'gerente',
    loadChildren: () => import('./gerente/gerente.module').then(m => m.GerenteModule)
  },
  { path: 'home', component: HomeGerenteComponent },
  { path: 'cupons', component: CuponsComponent }
];