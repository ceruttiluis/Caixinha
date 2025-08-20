import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LancarCupomComponent } from './lancar-cupom/lancar-cupom.component';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { COLABORADOR_ROUTES } from './colaborador.routes';
import { DashColaboradorComponent } from './dash-colaborador/dash-colaborador.component';

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(COLABORADOR_ROUTES),
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    DashColaboradorComponent,
    LancarCupomComponent
  ]
})
export class ColaboradorModule {}