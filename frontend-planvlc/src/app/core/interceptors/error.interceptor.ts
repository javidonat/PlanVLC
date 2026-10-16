import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AlertService } from '../services/alert.service';
import { ApiErrorResponse, ApiFieldError } from '../models/api.model';

// Error ya normalizado que reciben las páginas en el catch
export interface ApiFailure {
  message: string;
  errors?: ApiFieldError[];
  status?: number;
}

export function apiError(error: unknown): ApiFailure {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return { message: 'No se puede conectar con el backend. Comprueba que está arrancado.' };
    const body = error.error as Partial<ApiErrorResponse> | null;
    return {
      message: typeof body?.message === 'string' ? body.message : `Error HTTP ${error.status}`,
      errors: Array.isArray(body?.errors) ? body.errors : undefined,
      status: error.status,
    };
  }
  if (error instanceof Error) {
    if (error.name === 'TimeoutError') return { message: 'La petición ha tardado demasiado. Inténtalo de nuevo.' };
    return { message: 'Ha ocurrido un error inesperado.' };
  }
  // Ya viene normalizado por este interceptor
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error as ApiFailure;
  return { message: 'Ha ocurrido un error inesperado.' };
}

// { campo: mensaje } para pintar los errores 400 junto a cada campo.
// "categoryIds.0" → "categoryIds" (Zod indica la posición dentro de la lista)
export function fieldErrors(failure: ApiFailure): Record<string, string> {
  return Object.fromEntries((failure.errors ?? []).map(item => [item.field.split('.')[0], item.message]));
}

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const alerts = inject(AlertService);
  return next(request).pipe(catchError(error => {
    const failure = apiError(error);
    // Los formularios muestran los errores 400 junto a cada campo.
    if (failure.status !== 400) alerts.error(failure.message);
    return throwError(() => failure);
  }));
};
