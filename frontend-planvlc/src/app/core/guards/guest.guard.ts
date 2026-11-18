import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

// canActivate: login y registro solo sin sesión. Con sesión iniciada no tiene sentido: al inicio
export const guestGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  if (!store.isAuthenticated()) return true;
  return inject(Router).createUrlTree(['/']);
};
