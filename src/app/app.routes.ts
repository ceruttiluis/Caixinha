import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { FiliaisComponent } from './ciop/Filiais/filiais.component';
import { UsuariosComponent } from './ciop/usuarios/usuarios.component';
import { HomeComponent } from './home/home.component';
import { CuponsComponent } from './gerente/cupons/cupons.component';
import { CuponsCiopComponent } from './ciop/cupons-ciop/cupons-ciop.component';
import { UsuariosGerenteComponent } from './gerente/usuarios-gerente/usu-gerente.component';
import { CarteiraComponent } from './ciop/carteira/carteira.component';
import { DashCarteiraComponent } from './ciop/dashboard-carteira/dash-carteira.component';
import { LancarCupomComponent } from './colaborador/lancar-cupom/lancar-cupom.component';
import { DashColaboradorComponent } from './colaborador/dash-colaborador/dash-colaborador.component';
import { CuponsColaboradorComponent } from './colaborador/cupons-colaborador/cupons-colaborador.component';
import { SolicitacaoComponent } from './solicitacao/solicitacao.component';
import { SolicitacoesComponent } from './ciop/solicitacoes/solicitacoes.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  {
    path: 'ciop',
    loadChildren: () => import('./ciop/ciop.module').then(m => m.CiopModule)
  },
  { path: 'filiais', component: FiliaisComponent },
  { path: 'usuarios', component: UsuariosComponent },
  { path: 'cupons-ciop', component: CuponsCiopComponent },
  { path: 'carteira', component: CarteiraComponent },
  { path: 'dash-carteira', component: DashCarteiraComponent },
  { path: 'solicitacoes', component: SolicitacoesComponent },
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