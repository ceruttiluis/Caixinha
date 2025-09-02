import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes'; 
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AuthInterceptor } from './app/services/auth.interceptor';
<<<<<<< HEAD
=======
import { inject } from '@angular/core';
>>>>>>> 05a56228f89f7cbc4793218da81cb70fd6f31a9b

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(routes),
    AuthInterceptor 
  ]
});