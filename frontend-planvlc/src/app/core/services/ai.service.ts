import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api.model';
import { ChatMessage, PlanChatRequest, ReviewsAnalysis, ReviewsAnalysisRequest } from '../models/ai.model';
import { environment } from '../../../environments/environment';

// Solo habla con el servicio de IA (a través de la API Gateway: /api/ai/*)
@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly api = inject(ApiService);
  private readonly path = 'ai';

  // Pregunta sobre un plan. signal cancela la petición (ej. si se cambia de plan)
  async askPlan(request: PlanChatRequest, signal?: AbortSignal): Promise<ApiResponse<ChatMessage>> {
    return this.api.post<ApiResponse<ChatMessage>>(`${this.path}/plan-chat`, request, { signal, timeoutMs: environment.aiTimeoutMs });
  }

  // Resumen y sentimiento de las opiniones de un plan (a partir de sus comentarios)
  async analyzeReviews(request: ReviewsAnalysisRequest, signal?: AbortSignal): Promise<ApiResponse<ReviewsAnalysis>> {
    return this.api.post<ApiResponse<ReviewsAnalysis>>(`${this.path}/reviews-analysis`, request, { signal, timeoutMs: environment.aiTimeoutMs });
  }
}
