/**
 * JWT Authentication & Error Handling HTTP Interceptor
 * 
 * Automatically attaches Authorization: Bearer {token} header to outgoing requests
 * and intercepts 401 Unauthorized / 403 Forbidden errors to handle session expiries.
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  const token = localStorage.getItem('token');

  // Inject Bearer token into authorization header if session token exists
  let clonedReq = req;
  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Intercept and handle HTTP errors
  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Session expired or token invalidated
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigate(['/login']);
        toast.warning('Session expired. Please log in again.');
      } else if (error.status === 403) {
        // Insufficient role permissions
        toast.error('You do not have permission to perform this action.');
      } else if (error.status === 0) {
        // Server unreachable or CORS network error
        toast.error('Cannot connect to backend server. Ensure API is running on port 5000.');
      }
      return throwError(() => error);
    })
  );
};
