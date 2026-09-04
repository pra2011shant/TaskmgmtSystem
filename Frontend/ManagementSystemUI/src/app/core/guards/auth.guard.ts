/**
 * Route Authentication & Authorization Guards
 * 
 * Protects application routes from unauthenticated access and enforces
 * Role-Based Access Control (RBAC) permissions.
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Ensures user possesses a valid authentication session before activating route.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() || !!localStorage.getItem('token')) {
    return true;
  }

  // Redirect unauthenticated requests to login view with return query parameter
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

/**
 * Enforces specific role membership (e.g., Admin, Manager) on target route.
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.currentUser();

    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    // Redirect unauthorized users to dashboard
    router.navigate(['/dashboard']);
    return false;
  };
};
