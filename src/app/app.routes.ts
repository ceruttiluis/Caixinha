import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { HomeComponent } from './home/home.component';
import { LancarCupomComponent } from './lancar-cupom/lancar-cupom.component';
import { SolicitacaoComponent } from './solicitacao/solicitacao.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'lancar-cupom', component: LancarCupomComponent },
  { path: 'solicitacao', component: SolicitacaoComponent },
  {
    path: 'ciop',
    loadChildren: () => import('./ciop/ciop.module').then(m => m.CiopModule)
  },
  {
    path: 'colaborador',
    loadChildren: () => import('./colaborador/colaborador.module').then(m => m.ColaboradorModule)
  },
  {
    path: 'gerente',
    loadChildren: () => import('./gerente/gerente.module').then(m => m.GerenteModule)
  },
  {
    path: 'deparPessoas',
    loadChildren: () => import('./deparPessoas/deparPessoas.module').then(m => m.DPModule)
  },
];