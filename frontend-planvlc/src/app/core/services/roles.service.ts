import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiListResponse, ApiResponse } from '../models/api.model';
import { Role, RolePayload, RoleRef } from '../models/role.model';

// Solo habla con la API: no guarda estado (eso es cosa de RolesStore)
@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly api = inject(ApiService);
  private readonly path = 'roles';

  // Solo activos: opciones del formulario de usuarios
  async getActive(): Promise<ApiListResponse<RoleRef>> {
    return this.api.get<ApiListResponse<RoleRef>>(`${this.path}/active`);
  }

  // Todos: activos, desactivados y eliminados (para el panel)
  async getAll(): Promise<ApiListResponse<Role>> {
    return this.api.get<ApiListResponse<Role>>(this.path);
  }

  // Solo devuelve roles activos (404 si está desactivado o eliminado)
  async getById(id: string): Promise<ApiResponse<Role>> {
    return this.api.get<ApiResponse<Role>>(`${this.path}/${encodeURIComponent(id)}`);
  }

  async create(payload: RolePayload): Promise<ApiResponse<Role>> {
    return this.api.post<ApiResponse<Role>>(this.path, payload);
  }

  async update(id: string, payload: Partial<RolePayload>): Promise<ApiResponse<Role>> {
    return this.api.patch<ApiResponse<Role>>(`${this.path}/${encodeURIComponent(id)}`, payload);
  }

  async setActive(id: string, isActive: boolean): Promise<ApiResponse<Role>> {
    return this.api.patch<ApiResponse<Role>>(`${this.path}/${encodeURIComponent(id)}/active`, { isActive });
  }

  async softDelete(id: string): Promise<ApiResponse<Role>> {
    return this.api.patch<ApiResponse<Role>>(`${this.path}/${encodeURIComponent(id)}/softdelete`, {});
  }
}
