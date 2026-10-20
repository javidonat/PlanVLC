import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiListResponse, ApiResponse } from '../models/api.model';
import { VenueRef } from '../models/plan.model';
import { Venue, VenuePayload } from '../models/venue.model';

// Solo habla con la API: no guarda estado (eso es cosa de VenuesStore)
@Injectable({ providedIn: 'root' })
export class VenuesService {
  private readonly api = inject(ApiService);
  private readonly path = 'venues';

  // Solo activos: opciones del formulario de planes
  async getActive(): Promise<ApiListResponse<VenueRef>> {
    return this.api.get<ApiListResponse<VenueRef>>(`${this.path}/active`);
  }

  // Todos: activos, desactivados y eliminados (para el panel)
  async getAll(): Promise<ApiListResponse<Venue>> {
    return this.api.get<ApiListResponse<Venue>>(this.path);
  }

  // Solo devuelve lugares activos (404 si está desactivado o eliminado)
  async getById(id: string): Promise<ApiResponse<Venue>> {
    return this.api.get<ApiResponse<Venue>>(`${this.path}/${encodeURIComponent(id)}`);
  }

  async create(payload: VenuePayload): Promise<ApiResponse<Venue>> {
    return this.api.post<ApiResponse<Venue>>(this.path, payload);
  }

  async update(id: string, payload: Partial<VenuePayload>): Promise<ApiResponse<Venue>> {
    return this.api.patch<ApiResponse<Venue>>(`${this.path}/${encodeURIComponent(id)}`, payload);
  }

  async setActive(id: string, isActive: boolean): Promise<ApiResponse<Venue>> {
    return this.api.patch<ApiResponse<Venue>>(`${this.path}/${encodeURIComponent(id)}/active`, { isActive });
  }

  async softDelete(id: string): Promise<ApiResponse<Venue>> {
    return this.api.patch<ApiResponse<Venue>>(`${this.path}/${encodeURIComponent(id)}/softdelete`, {});
  }
}
