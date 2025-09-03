import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { HomeComponent } from './home/home.component';
import { CuponsComponent } from './gerente/cupons/cupons.component';
import { UsuariosGerenteComponent } from './gerente/usuarios-gerente/usu-gerente.component';
import { LancarCupomComponent } from './colaborador/lancar-cupom/lancar-cupom.component';
import { DashColaboradorComponent } from './colaborador/dash-colaborador/dash-colaborador.component';
import { CuponsColaboradorComponent } from './colaborador/cupons-colaborador/cupons-colaborador.component';
import { SolicitacaoComponent } from './solicitacao/solicitacao.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  {
    path: 'ciop',
    loadChildren: () => import('./ciop/ciop.module').then(m => m.CiopModule)
  },
  {
    path: 'colaborador',
    loadChildren: () => import('./colaborador/colaborador.module').then(m => m.ColaboradorModule)
  },
  { path: 'lancar-cupom', component: LancarCupomComponent },
  { path: 'dash-colaborador', component: DashColaboradorComponent },
  { path: 'cupons-colaborador', component: CuponsColaboradorComponent },
  { path: 'solicitacao', component: SolicitacaoComponent },
  {
    path: 'gerente',
    loadChildren: () => import('./gerente/gerente.module').then(m => m.GerenteModule)
  },
  { path: 'cupons', component: CuponsComponent },
  { path: 'usuarios-gerente', component: UsuariosGerenteComponent },
];