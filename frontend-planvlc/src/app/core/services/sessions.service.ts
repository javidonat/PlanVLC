import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiListResponse, ApiResponse } from '../models/api.model';
import { Session, SessionPayload } from '../models/session.model';

// Solo habla con la API: no guarda estado (eso es cosa de SessionsStore)
@Injectable({ providedIn: 'root' })
export class SessionsService {
  private readonly api = inject(ApiService);
  private readonly path = 'sessions';

  // Todas: activas, desactivadas y eliminadas (para el panel)
  async getAll(): Promise<ApiListResponse<Session>> {
    return this.api.get<ApiListResponse<Session>>(this.path);
  }

  // Solo devuelve sesiones activas (404 si está desactivada o eliminada)
  async getById(id: string): Promise<ApiResponse<Session>> {
    return this.api.get<ApiResponse<Session>>(`${this.path}/${encodeURIComponent(id)}`);
  }

  async create(payload: SessionPayload): Promise<ApiResponse<Session>> {
    return this.api.post<ApiResponse<Session>>(this.path, payload);
  }

  async update(id: string, payload: Partial<SessionPayload>): Promise<ApiResponse<Session>> {
    return this.api.patch<ApiResponse<Session>>(`${this.path}/${encodeURIComponent(id)}`, payload);
  }

  async setActive(id: string, isActive: boolean): Promise<ApiResponse<Session>> {
    return this.api.patch<ApiResponse<Session>>(`${this.path}/${encodeURIComponent(id)}/active`, { isActive });
  }

  async softDelete(id: string): Promise<ApiResponse<Session>> {
    return this.api.patch<ApiResponse<Session>>(`${this.path}/${encodeURIComponent(id)}/softdelete`, {});
  }
}
