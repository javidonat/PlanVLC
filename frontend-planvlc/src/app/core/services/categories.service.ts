import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiListResponse } from '../models/api.model';
import { CategoryRef } from '../models/plan.model';

// Solo lectura: categorías activas para el formulario de planes
@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly api = inject(ApiService);

  async getActive(): Promise<ApiListResponse<CategoryRef>> {
    return this.api.get<ApiListResponse<CategoryRef>>('categories/active');
  }
}
