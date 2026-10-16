import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiListResponse } from '../models/api.model';
import { OrganizerRef } from '../models/plan.model';

// Solo lectura: organizadores activos para el formulario de planes
@Injectable({ providedIn: 'root' })
export class OrganizersService {
  private readonly api = inject(ApiService);

  async getActive(): Promise<ApiListResponse<OrganizerRef>> {
    return this.api.get<ApiListResponse<OrganizerRef>>('organizers/active');
  }
}
