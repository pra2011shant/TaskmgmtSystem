// ==============================================================================================
// ⚙️ ANGULAR APPLICATION CONFIGURATION
// ==============================================================================================
// Yeh file Angular standalone application ke core providers configure karti hai:
// 1. Router setup (Routes array & component input binding)
// 2. HTTP Client setup with automatic JWT Interceptor
// ==============================================================================================

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Change detection performance optimization
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Application routing table with route parameters binding
    provideRouter(routes, withComponentInputBinding()),
    
    // HTTP Client with automatic Authorization Bearer token interceptor
    provideHttpClient(withInterceptors([jwtInterceptor]))
  ]
};
