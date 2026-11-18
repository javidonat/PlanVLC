import { HttpInterceptorFn } from '@angular/common/http';

// Cabecera común a todas las peticiones. Las cookies de la sesión las activa authInterceptor (withCredentials).
export const requestInterceptor: HttpInterceptorFn = (request, next) =>
  next(request.clone({ setHeaders: { Accept: 'application/json' } }));
