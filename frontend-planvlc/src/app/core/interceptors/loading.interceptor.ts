import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (request, next) => {
  // Las lecturas muestran el skeleton de su página; el spinner cubre las mutaciones.
  if (request.method === 'GET') return next(request);
  const loading = inject(LoadingService);
  loading.show();
  return next(request).pipe(finalize(() => loading.hide()));
};
