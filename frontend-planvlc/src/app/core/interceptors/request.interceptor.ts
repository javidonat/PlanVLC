import { HttpInterceptorFn } from '@angular/common/http';

// Punto de integración para una futura autenticación, sin simular credenciales hoy.
export const requestInterceptor: HttpInterceptorFn = (request, next) =>
  next(request.clone({ setHeaders: { Accept: 'application/json' } }));
