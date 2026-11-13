import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiListResponse, ApiPagedResponse, ApiResponse } from '../models/api.model';
import { ListFilters, ListSpec, listQueryParams } from '../models/list.model';
import { User, UserPayload, UserRef } from '../models/user.model';

// Solo habla con la API: no guarda estado (eso es cosa de UsersStore)
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly api = inject(ApiService);
  private readonly path = 'users';

  // Solo activos: opciones del formulario de organizadores
  async getActive(): Promise<ApiListResponse<UserRef>> {
    return this.api.get<ApiListResponse<UserRef>>(`${this.path}/active`);
  }

  // Todos: activos, desactivados y eliminados (para el panel)
  // Listado del panel: filtros, orden y página. signal cancela la petición si llega otra más nueva
  async getList(filters: ListFilters, spec: ListSpec, signal?: AbortSignal): Promise<ApiPagedResponse<User>> {
    return this.api.get<ApiPagedResponse<User>>(this.path, { params: listQueryParams(filters, spec), signal });
  }

  async getAll(): Promise<ApiListResponse<User>> {
    return this.api.get<ApiListResponse<User>>(this.path);
  }

  // Solo devuelve usuarios activos (404 si está desactivado o eliminado)
  async getById(id: string): Promise<ApiResponse<User>> {
    return this.api.get<ApiResponse<User>>(`${this.path}/${encodeURIComponent(id)}`);
  }

  async create(payload: UserPayload): Promise<ApiResponse<User>> {
    return this.api.post<ApiResponse<User>>(this.path, payload);
  }

  async update(id: string, payload: Partial<UserPayload>): Promise<ApiResponse<User>> {
    return this.api.patch<ApiResponse<User>>(`${this.path}/${encodeURIComponent(id)}`, payload);
  }

  async setActive(id: string, isActive: boolean): Promise<ApiResponse<User>> {
    return this.api.patch<ApiResponse<User>>(`${this.path}/${encodeURIComponent(id)}/active`, { isActive });
  }

  async softDelete(id: string): Promise<ApiResponse<User>> {
    return this.api.patch<ApiResponse<User>>(`${this.path}/${encodeURIComponent(id)}/softdelete`, {});
  }
}
