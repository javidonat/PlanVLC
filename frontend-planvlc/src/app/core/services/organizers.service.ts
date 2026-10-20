import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiListResponse, ApiResponse } from '../models/api.model';
import { OrganizerRef } from '../models/plan.model';
import { Organizer, OrganizerPayload } from '../models/organizer.model';

// Solo habla con la API: no guarda estado (eso es cosa de OrganizersStore)
@Injectable({ providedIn: 'root' })
export class OrganizersService {
  private readonly api = inject(ApiService);
  private readonly path = 'organizers';

  // Solo activos: opciones del formulario de planes
  async getActive(): Promise<ApiListResponse<OrganizerRef>> {
    return this.api.get<ApiListResponse<OrganizerRef>>(`${this.path}/active`);
  }

  // Todos: activos, desactivados y eliminados (para el panel)
  async getAll(): Promise<ApiListResponse<Organizer>> {
    return this.api.get<ApiListResponse<Organizer>>(this.path);
  }

  // Solo devuelve organizadores activos (404 si está desactivado o eliminado)
  async getById(id: string): Promise<ApiResponse<Organizer>> {
    return this.api.get<ApiResponse<Organizer>>(`${this.path}/${encodeURIComponent(id)}`);
  }

  async create(payload: OrganizerPayload): Promise<ApiResponse<Organizer>> {
    return this.api.post<ApiResponse<Organizer>>(this.path, payload);
  }

  async update(id: string, payload: Partial<OrganizerPayload>): Promise<ApiResponse<Organizer>> {
    return this.api.patch<ApiResponse<Organizer>>(`${this.path}/${encodeURIComponent(id)}`, payload);
  }

  async setActive(id: string, isActive: boolean): Promise<ApiResponse<Organizer>> {
    return this.api.patch<ApiResponse<Organizer>>(`${this.path}/${encodeURIComponent(id)}/active`, { isActive });
  }

  async softDelete(id: string): Promise<ApiResponse<Organizer>> {
    return this.api.patch<ApiResponse<Organizer>>(`${this.path}/${encodeURIComponent(id)}/softdelete`, {});
  }
}
