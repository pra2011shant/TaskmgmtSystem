import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  const authService = inject(AuthService);
  const token = localStorage.getItem('token');

  let clonedReq = req;
  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't intercept auth login/register/refresh endpoints
      if (error.status === 401 && !req.url.includes('/api/auth/')) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          if (!isRefreshing) {
            isRefreshing = true;
            refreshTokenSubject.next(null);

            return authService.refreshSession().pipe(
              switchMap((authRes) => {
                isRefreshing = false;
                refreshTokenSubject.next(authRes.token);
                return next(req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${authRes.token}`
                  }
                }));
              }),
              catchError((refreshErr) => {
                isRefreshing = false;
                authService.logout();
                toast.warning('Session expired. Please log in again.');
                return throwError(() => refreshErr);
              })
            );
          } else {
            return refreshTokenSubject.pipe(
              filter((newToken) => newToken !== null),
              take(1),
              switchMap((newToken) => {
                return next(req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`
                  }
                }));
              })
            );
          }
        } else {
          authService.logout();
          toast.warning('Session expired. Please log in again.');
        }
      } else if (error.status === 403) {
        toast.error('You do not have permission to perform this action.');
      } else if (error.status === 429) {
        toast.warning('Rate limit exceeded. Please wait a moment before retrying.');
      } else if (error.status === 0) {
        toast.error('Cannot connect to backend server. Ensure API is running on port 5000.');
      } else if (error.status >= 500) {
        const msg = error.error?.message || 'Server encountered an unexpected error. Please try again.';
        toast.error(msg);
      }
      return throwError(() => error);
    })
  );
};
