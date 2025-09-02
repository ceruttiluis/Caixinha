import { Routes } from '@angular/router';
import { DashboardCiopComponent } from './dashboard-ciop/dashboard-ciop.component';
import { FiliaisComponent } from './Filiais/filiais.component';

export const CIOP_ROUTES: Routes = [
  { path: '', component: DashboardCiopComponent },
  { path: '', component: FiliaisComponent }
];