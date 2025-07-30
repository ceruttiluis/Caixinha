import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { SidebarGerenteComponent } from '../gerente/shared-gerente/sidebar.component';
import { DashboardGerenteComponent } from '../gerente/dashboard-gerente/dashboard-gerente.component';

@NgModule({
  declarations: [HeaderComponent, SidebarGerenteComponent, DashboardGerenteComponent],
  imports: [CommonModule,],
  exports: [HeaderComponent, SidebarGerenteComponent, DashboardGerenteComponent] 
})
export class SharedModule {}