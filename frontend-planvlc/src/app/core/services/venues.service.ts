import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiListResponse } from '../models/api.model';
import { VenueRef } from '../models/plan.model';

// Solo lectura: lugares activos para el formulario de planes
@Injectable({ providedIn: 'root' })
export class VenuesService {
  private readonly api = inject(ApiService);

  async getActive(): Promise<ApiListResponse<VenueRef>> {
    return this.api.get<ApiListResponse<VenueRef>>('venues/active');
  }
}
