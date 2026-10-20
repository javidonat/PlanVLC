import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiListResponse, ApiResponse } from '../models/api.model';
import { Image, ImagePayload } from '../models/image.model';

// Solo habla con la API: no guarda estado (eso es cosa de ImagesStore)
@Injectable({ providedIn: 'root' })
export class ImagesService {
  private readonly api = inject(ApiService);
  private readonly path = 'images';

  // Todas: activas, desactivadas y eliminadas (para el panel)
  async getAll(): Promise<ApiListResponse<Image>> {
    return this.api.get<ApiListResponse<Image>>(this.path);
  }

  // Solo devuelve imágenes activas (404 si está desactivada o eliminada)
  async getById(id: string): Promise<ApiResponse<Image>> {
    return this.api.get<ApiResponse<Image>>(`${this.path}/${encodeURIComponent(id)}`);
  }

  async create(payload: ImagePayload): Promise<ApiResponse<Image>> {
    return this.api.post<ApiResponse<Image>>(this.path, payload);
  }

  async update(id: string, payload: Partial<ImagePayload>): Promise<ApiResponse<Image>> {
    return this.api.patch<ApiResponse<Image>>(`${this.path}/${encodeURIComponent(id)}`, payload);
  }

  async setActive(id: string, isActive: boolean): Promise<ApiResponse<Image>> {
    return this.api.patch<ApiResponse<Image>>(`${this.path}/${encodeURIComponent(id)}/active`, { isActive });
  }

  async softDelete(id: string): Promise<ApiResponse<Image>> {
    return this.api.patch<ApiResponse<Image>>(`${this.path}/${encodeURIComponent(id)}/softdelete`, {});
  }
}
