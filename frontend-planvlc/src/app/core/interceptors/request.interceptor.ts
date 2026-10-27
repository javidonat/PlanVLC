import { HttpInterceptorFn } from '@angular/common/http';

// Cabecera común a todas las peticiones. El token lo añade authInterceptor.
export const requestInterceptor: HttpInterceptorFn = (request, next) =>
  next(request.clone({ setHeaders: { Accept: 'application/json' } }));
