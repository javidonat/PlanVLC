import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiListResponse, ApiPagedResponse, ApiResponse } from '../models/api.model';
import { EMPTY_SESSION_FILTERS, Session, SessionListFilters, SessionPayload } from '../models/session.model';

// Solo habla con la API: no guarda estado (eso es cosa de SessionsStore)
@Injectable({ providedIn: 'root' })
export class SessionsService {
  private readonly api = inject(ApiService);
  private readonly path = 'sessions';

  // Todas: activas, desactivadas y eliminadas (para el panel)
  async getAll(): Promise<ApiListResponse<Session>> {
    return this.api.get<ApiListResponse<Session>>(this.path);
  }

  // Listado del panel: filtros, orden y página. signal cancela la petición si llega otra más nueva
  async getList(filters: SessionListFilters, signal?: AbortSignal): Promise<ApiPagedResponse<Session>> {
    return this.api.get<ApiPagedResponse<Session>>(this.path, { params: { ...this.listParams(filters), page: filters.page }, signal });
  }

  // Todas las sesiones de un mes que cumplen los filtros, sin paginar (vista calendario)
  async getMonth(filters: SessionListFilters, month: string, signal?: AbortSignal): Promise<ApiListResponse<Session>> {
    return this.api.get<ApiListResponse<Session>>(this.path, { params: { ...this.listParams(filters), month }, signal });
  }

  private listParams(filters: SessionListFilters) {
    return {
      search: filters.search.trim(),
      status: filters.status,
      state: filters.state,
      plan: filters.plan,
      sort: filters.sort !== EMPTY_SESSION_FILTERS.sort ? filters.sort : null,
    };
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
