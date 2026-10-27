import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';
import { AlertService } from '../services/alert.service';

// canActivate: solo para el rol admin. Sin sesión → login; con otro rol → aviso y a su perfil
export const adminGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (!store.isAuthenticated()) return router.createUrlTree(['/login']);
  if (store.isAdmin()) return true;
  inject(AlertService).error('No tienes permiso para acceder a esta sección.');
  return router.createUrlTree(['/perfil']);
};
