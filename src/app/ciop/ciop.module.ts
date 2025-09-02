import { NgModule } from '@angular/core';
<<<<<<< HEAD
import { CommonModule } from '@angular/common';
import { CiopRoutingModule } from './ciop-routing.module';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    CiopRoutingModule
  ]
})
export class CiopModule {}
=======
import { RouterModule } from '@angular/router';
import { CIOP_ROUTES } from './ciop.routes';

@NgModule({
  imports: [RouterModule.forChild(CIOP_ROUTES)],
})
export class CiopModule {
  constructor() {
  }
}
>>>>>>> 05a56228f89f7cbc4793218da81cb70fd6f31a9b
