import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LancarCupomComponent } from './lancar-cupom/lancar-cupom.component';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MinhasSolicitacoesComponent } from '../../app/colaborador/solicitacoes/minhas-solicitacoes.component';
import { COLABORADOR_ROUTES } from './colaborador.routes';

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(COLABORADOR_ROUTES),
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MinhasSolicitacoesComponent,
    LancarCupomComponent
  ]
})
export class ColaboradorModule {}