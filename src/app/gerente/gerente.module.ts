import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GerenteRoutingModule } from './gerente-routing.module';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [ ],
  imports: [
    CommonModule,
    RouterModule,
    GerenteRoutingModule,
    SharedModule
  ]
})
export class GerenteModule { }