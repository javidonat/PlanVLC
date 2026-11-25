import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

// Query params de un GET. Los vacíos (undefined, null o '') no se envían
export type QueryParams = Record<string, string | number | null | undefined>;

// Opciones de un GET: query params y AbortSignal para cancelar la petición
export interface GetOptions {
  params?: QueryParams;
  signal?: AbortSignal;
}

// Opciones de un POST: AbortSignal y un tiempo máximo distinto del normal (ej. la IA tarda más)
export interface PostOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');

  get<T>(path: string, options: GetOptions = {}): Promise<T> {
    const request = this.http.get<T>(this.url(path), { params: this.params(options.params) });
    return options.signal ? this.sendAbortable(request, options.signal) : this.send(request);
  }

  post<T>(path: string, body: unknown, options: PostOptions = {}): Promise<T> {
    const request = this.http.post<T>(this.url(path), body);
    return options.signal ? this.sendAbortable(request, options.signal, options.timeoutMs) : this.send(request, options.timeoutMs);
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.send(this.http.patch<T>(this.url(path), body));
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.send(this.http.put<T>(this.url(path), body));
  }

  delete<T>(path: string): Promise<T> {
    return this.send(this.http.delete<T>(this.url(path)));
  }

  // Construye los query params sin los vacíos (ej. { search: '', page: 2 } → ?page=2)
  private params(params: QueryParams = {}): HttpParams {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '') httpParams = httpParams.set(key, String(value));
    }
    return httpParams;
  }

  private url(path: string): string {
    return `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
  }

  // Como send(), pero si se aborta el signal se cancela la petición HTTP (unsubscribe)
  // y la promesa falla con un AbortError, que la página ignora. Evita las race conditions:
  // la respuesta de una petición antigua nunca pisa a la de la nueva.
  private sendAbortable<T>(request: Observable<T>, signal: AbortSignal, timeoutMs = environment.apiTimeoutMs): Promise<T> {
    const aborted = () => new DOMException('Petición cancelada', 'AbortError');
    if (signal.aborted) return Promise.reject(aborted());
    return new Promise<T>((resolve, reject) => {
      const subscription = request.pipe(timeout(timeoutMs)).subscribe({ next: resolve, error: reject });
      signal.addEventListener('abort', () => {
        subscription.unsubscribe();
        reject(aborted());
      }, { once: true });
    });
  }

  private async send<T>(request: Observable<T>, timeoutMs = environment.apiTimeoutMs): Promise<T> {
    try {
      return await firstValueFrom(request.pipe(timeout(timeoutMs)));
    } catch (error) {
      throw error;
    }
  }
}
