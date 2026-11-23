import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiListResponse, ApiResponse } from '../models/api.model';
import { WishlistItem, WishlistState } from '../models/wishlist.model';

// Solo habla con la API de la lista de deseos (/api/wishlist). Siempre la del usuario de la sesión
@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly api = inject(ApiService);
  private readonly path = 'wishlist';

  async getMine(signal?: AbortSignal): Promise<ApiListResponse<WishlistItem>> {
    return this.api.get<ApiListResponse<WishlistItem>>(this.path, { signal });
  }

  async add(planId: string): Promise<ApiResponse<WishlistState>> {
    return this.api.post<ApiResponse<WishlistState>>(this.path, { planId });
  }

  async remove(planId: string): Promise<ApiResponse<WishlistState>> {
    return this.api.delete<ApiResponse<WishlistState>>(`${this.path}/${planId}`);
  }
}
