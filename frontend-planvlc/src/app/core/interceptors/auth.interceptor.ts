import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService, TOKEN_KEY } from '../services/auth.service';

// Añade "Authorization: Bearer <token>" (el JWT guardado en localStorage) a las peticiones al backend.
// Si el backend responde 401 (token caducado, logout en otro sitio...), cierra la sesión y lleva al login.
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = localStorage.getItem(TOKEN_KEY);
  const toApi = request.url.startsWith(environment.apiUrl);
  const authRequest = token && toApi ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

  return next(authRequest).pipe(catchError(error => {
    // En el login un 401 es "email o contraseña incorrectos": lo muestra el formulario
    if (error?.status === 401 && !request.url.endsWith('/auth/login')) {
      auth.clearSession();
      void router.navigate(['/login']);
    }
    return throwError(() => error);
  }));
};
