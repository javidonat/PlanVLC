import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');

  get<T>(path: string): Promise<T> {
    return this.send(this.http.get<T>(this.url(path)));
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.send(this.http.post<T>(this.url(path), body));
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.send(this.http.patch<T>(this.url(path), body));
  }

  private url(path: string): string {
    return `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
  }

  private async send<T>(request: import('rxjs').Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(request.pipe(timeout(environment.apiTimeoutMs)));
    } catch (error) {
      throw error;
    }
  }
}
