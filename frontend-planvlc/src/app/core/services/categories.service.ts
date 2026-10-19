import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiListResponse, ApiResponse } from '../models/api.model';
import { CategoryRef } from '../models/plan.model';
import { Category, CategoryPayload } from '../models/category.model';

// Solo habla con la API: no guarda estado (eso es cosa de CategoriesStore)
@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly api = inject(ApiService);
  private readonly path = 'categories';

  // Solo activas: opciones del formulario de planes
  async getActive(): Promise<ApiListResponse<CategoryRef>> {
    return this.api.get<ApiListResponse<CategoryRef>>(`${this.path}/active`);
  }

  // Todas: activas, desactivadas y eliminadas (para el panel)
  async getAll(): Promise<ApiListResponse<Category>> {
    return this.api.get<ApiListResponse<Category>>(this.path);
  }

  // Solo devuelve categorías activas (404 si está desactivada o eliminada)
  async getById(id: string): Promise<ApiResponse<Category>> {
    return this.api.get<ApiResponse<Category>>(`${this.path}/${encodeURIComponent(id)}`);
  }

  async create(payload: CategoryPayload): Promise<ApiResponse<Category>> {
    return this.api.post<ApiResponse<Category>>(this.path, payload);
  }

  async update(id: string, payload: Partial<CategoryPayload>): Promise<ApiResponse<Category>> {
    return this.api.patch<ApiResponse<Category>>(`${this.path}/${encodeURIComponent(id)}`, payload);
  }

  async setActive(id: string, isActive: boolean): Promise<ApiResponse<Category>> {
    return this.api.patch<ApiResponse<Category>>(`${this.path}/${encodeURIComponent(id)}/active`, { isActive });
  }

  async softDelete(id: string): Promise<ApiResponse<Category>> {
    return this.api.patch<ApiResponse<Category>>(`${this.path}/${encodeURIComponent(id)}/softdelete`, {});
  }
}
