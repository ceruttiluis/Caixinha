import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CiopRoutingModule } from './ciop-routing.module';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule,
    CiopRoutingModule,
    SharedModule
  ]
})
export class CiopModule { }