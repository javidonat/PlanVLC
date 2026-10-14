import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AlertService } from '../services/alert.service';

export interface ApiFailure {
  mensaje: string;
  errores?: { campo: string; mensaje: string }[];
  status?: number;
}

export function apiError(error: unknown): ApiFailure {
  if (error && typeof error === 'object' && 'mensaje' in error && typeof error.mensaje === 'string') return error as ApiFailure;
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return { mensaje: 'No se puede conectar con el backend. Comprueba que está arrancado.' };
    const body = error.error as Partial<ApiFailure> | null;
    return {
      mensaje: typeof body?.mensaje === 'string' ? body.mensaje : `Error HTTP ${error.status}`,
      errores: Array.isArray(body?.errores) ? body.errores : undefined,
      status: error.status,
    };
  }
  if (error instanceof Error && error.name === 'TimeoutError') return { mensaje: 'La petición ha tardado demasiado. Inténtalo de nuevo.' };
  return { mensaje: 'Ha ocurrido un error inesperado.' };
}

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const alerts = inject(AlertService);
  return next(request).pipe(catchError(error => {
    const failure = apiError(error);
    // Los formularios muestran los errores 400 junto a cada campo.
    if (failure.status !== 400) alerts.error(failure.mensaje);
    return throwError(() => failure);
  }));
};
