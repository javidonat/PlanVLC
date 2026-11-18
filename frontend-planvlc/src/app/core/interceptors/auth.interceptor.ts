import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { AuthStore } from '../stores/auth.store';

// Peticiones de auth en las que un 401 NO significa "access token caducado":
// login (email o contraseña incorrectos), registro, el propio refresh y el logout
const NO_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

// 1) withCredentials: el navegador manda las cookies de la sesión (access_token y refresh_token) a la API.
// 2) Hay dos 401:
//    - 401 de una petición normal: el access token ha caducado → POST /auth/refresh y se repite la petición
//    - 401 del refresh: el refresh token tampoco vale → se cierra la sesión y, si había una, al login
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const store = inject(AuthStore);
  const router = inject(Router);

  const toApi = request.url.startsWith(environment.apiUrl);
  const apiRequest = toApi ? request.clone({ withCredentials: true }) : request;

  return next(apiRequest).pipe(catchError(error => {
    if (error?.status !== 401 || !toApi || NO_REFRESH.some(path => request.url.endsWith(path))) {
      return throwError(() => error);
    }
    return from(auth.refresh()).pipe(switchMap(refreshed => {
      if (refreshed) return next(apiRequest); // cookies nuevas: se repite la petición
      const hadSession = store.isAuthenticated();
      auth.clearSession();
      // Al arrancar sin sesión (GET /me) no se redirige: el visitante sigue en la tienda
      if (hadSession) void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      return throwError(() => error);
    }));
  }));
};
