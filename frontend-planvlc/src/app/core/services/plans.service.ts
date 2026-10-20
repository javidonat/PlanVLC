import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiListResponse, ApiResponse } from '../models/api.model';
import { Plan, PlanPayload } from '../models/plan.model';

// Solo habla con la API: no guarda estado (eso es cosa de PlansStore)
@Injectable({ providedIn: 'root' })
export class PlansService {
  private readonly api = inject(ApiService);
  private readonly path = 'plans';

  // Todos: activos, desactivados y eliminados (para el panel)
  async getAll(): Promise<ApiListResponse<Plan>> {
    return this.api.get<ApiListResponse<Plan>>(this.path);
  }

  // Solo activos: opciones del formulario de sesiones
  async getActive(): Promise<ApiListResponse<Plan>> {
    return this.api.get<ApiListResponse<Plan>>(`${this.path}/active`);
  }

  // Solo devuelve planes activos (404 si está desactivado o eliminado)
  async getById(id: string): Promise<ApiResponse<Plan>> {
    return this.api.get<ApiResponse<Plan>>(`${this.path}/${encodeURIComponent(id)}`);
  }

  async create(payload: PlanPayload): Promise<ApiResponse<Plan>> {
    return this.api.post<ApiResponse<Plan>>(this.path, payload);
  }

  async update(id: string, payload: Partial<PlanPayload>): Promise<ApiResponse<Plan>> {
    return this.api.patch<ApiResponse<Plan>>(`${this.path}/${encodeURIComponent(id)}`, payload);
  }

  async setActive(id: string, isActive: boolean): Promise<ApiResponse<Plan>> {
    return this.api.patch<ApiResponse<Plan>>(`${this.path}/${encodeURIComponent(id)}/active`, { isActive });
  }

  async softDelete(id: string): Promise<ApiResponse<Plan>> {
    return this.api.patch<ApiResponse<Plan>>(`${this.path}/${encodeURIComponent(id)}/softdelete`, {});
  }
}
