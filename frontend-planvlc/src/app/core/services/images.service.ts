import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiListResponse } from '../models/api.model';
import { ImageRef } from '../models/plan.model';

// Solo lectura: imágenes activas para el formulario de planes
@Injectable({ providedIn: 'root' })
export class ImagesService {
  private readonly api = inject(ApiService);

  async getActive(): Promise<ApiListResponse<ImageRef>> {
    return this.api.get<ApiListResponse<ImageRef>>('images/active');
  }
}
