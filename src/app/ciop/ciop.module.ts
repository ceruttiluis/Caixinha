import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CIOP_ROUTES } from './ciop.routes';

@NgModule({
  imports: [RouterModule.forChild(CIOP_ROUTES)],
})
export class CiopModule {
  constructor() {
  }
}