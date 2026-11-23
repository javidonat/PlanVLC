import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiListResponse, ApiResponse } from '../models/api.model';
import { LikeState, PlanLikes } from '../models/like.model';
import { SavedPlanItem } from '../models/saved-plan.model';

// Solo habla con la API de likes (/api/likes)
@Injectable({ providedIn: 'root' })
export class LikesService {
  private readonly api = inject(ApiService);
  private readonly path = 'likes';

  // Número de likes de un plan (público)
  async getCount(planId: string, signal?: AbortSignal): Promise<ApiResponse<PlanLikes>> {
    return this.api.get<ApiResponse<PlanLikes>>(`${this.path}/${planId}`, { signal });
  }

  // Planes a los que el usuario de la sesión ha dado like
  async getMine(signal?: AbortSignal): Promise<ApiListResponse<SavedPlanItem>> {
    return this.api.get<ApiListResponse<SavedPlanItem>>(`${this.path}/me`, { signal });
  }

  async like(planId: string): Promise<ApiResponse<LikeState>> {
    return this.api.post<ApiResponse<LikeState>>(this.path, { planId });
  }

  async unlike(planId: string): Promise<ApiResponse<LikeState>> {
    return this.api.delete<ApiResponse<LikeState>>(`${this.path}/${planId}`);
  }
}
