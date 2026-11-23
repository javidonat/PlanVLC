import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiListResponse, ApiResponse } from '../models/api.model';
import { CommentPayload, CommentsResponse, CommentsSummaryItem, PlanComment } from '../models/comment.model';

// Solo habla con la API de comentarios (/api/comments)
@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly api = inject(ApiService);
  private readonly path = 'comments';

  // Comentarios de un plan (por su slug), los más nuevos primero, con la media de valoraciones
  async getByPlan(slug: string, page: number, limit: number, signal?: AbortSignal): Promise<CommentsResponse> {
    return this.api.get<CommentsResponse>(this.path, { params: { plan: slug, page, limit }, signal });
  }

  async create(payload: CommentPayload): Promise<ApiResponse<PlanComment>> {
    return this.api.post<ApiResponse<PlanComment>>(this.path, payload);
  }

  // Borrado lógico: el backend comprueba que es tuyo (o que eres admin)
  async softDelete(id: string): Promise<ApiResponse<null>> {
    return this.api.patch<ApiResponse<null>>(`${this.path}/${id}/softdelete`, {});
  }

  // Panel admin: número de comentarios y media de cada plan
  async getSummary(): Promise<ApiListResponse<CommentsSummaryItem>> {
    return this.api.get<ApiListResponse<CommentsSummaryItem>>(`${this.path}/summary`);
  }
}
