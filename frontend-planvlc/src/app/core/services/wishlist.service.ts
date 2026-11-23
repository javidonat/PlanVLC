import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiListResponse, ApiResponse } from '../models/api.model';
import { WishlistState } from '../models/wishlist.model';
import { SavedPlanItem } from '../models/saved-plan.model';

// Solo habla con la API de la lista de deseos (/api/wishlist). Siempre la del usuario de la sesión
@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly api = inject(ApiService);
  private readonly path = 'wishlist';

  async getMine(signal?: AbortSignal): Promise<ApiListResponse<SavedPlanItem>> {
    return this.api.get<ApiListResponse<SavedPlanItem>>(this.path, { signal });
  }

  async add(planId: string): Promise<ApiResponse<WishlistState>> {
    return this.api.post<ApiResponse<WishlistState>>(this.path, { planId });
  }

  async remove(planId: string): Promise<ApiResponse<WishlistState>> {
    return this.api.delete<ApiResponse<WishlistState>>(`${this.path}/${planId}`);
  }
}
