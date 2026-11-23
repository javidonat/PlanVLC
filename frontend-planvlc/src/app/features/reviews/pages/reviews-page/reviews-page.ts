import { Component, OnInit, inject, signal } from '@angular/core';
import { CommentsSummaryItem } from '../../../../core/models/comment.model';
import { ReviewsAnalysis } from '../../../../core/models/ai.model';
import { CommentsService } from '../../../../core/services/comments.service';
import { AiService } from '../../../../core/services/ai.service';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { PlanReviewsCard } from '../../components/plan-reviews-card/plan-reviews-card';

// Panel admin (/admin/opiniones): planes con comentarios (número y media) y, al pedirlo,
// el análisis de sentimiento que hace el agente de IA con sus últimos comentarios.
// La IA no accede a la base de datos: la página le pasa los comentarios
@Component({
  selector: 'app-reviews-page',
  imports: [SkeletonLoader, ErrorState, EmptyState, PlanReviewsCard],
  templateUrl: './reviews-page.html',
})
export class ReviewsPage implements OnInit {
  private readonly commentsService = inject(CommentsService);
  private readonly ai = inject(AiService);

  private static readonly MAX_COMMENTS = 50; // lo máximo que acepta el servicio de IA

  readonly items = signal<CommentsSummaryItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  // Por plan (planId): su análisis, si se está analizando y su error
  readonly analyses = signal<Partial<Record<string, ReviewsAnalysis>>>({});
  readonly analyzing = signal<Partial<Record<string, boolean>>>({});
  readonly analysisErrors = signal<Partial<Record<string, string>>>({});

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);
      const res = await this.commentsService.getSummary();
      this.items.set(res.data);
    } catch (error) {
      this.error.set(apiError(error).message);
    } finally {
      this.loading.set(false);
    }
  }

  // Últimos comentarios del plan → agente de IA → sentimiento, puntuación, puntos fuertes y débiles
  async onAnalyze(item: CommentsSummaryItem): Promise<void> {
    if (this.analyzing()[item.planId]) return;
    this.analyzing.update(state => ({ ...state, [item.planId]: true }));
    this.analysisErrors.update(({ [item.planId]: _, ...rest }) => rest);
    try {
      const comments = await this.commentsService.getByPlan(item.slug, 1, ReviewsPage.MAX_COMMENTS);
      const res = await this.ai.analyzeReviews({ plan: { title: item.title }, comments: comments.data.map(({ rating, text }) => ({ rating, text })) });
      this.analyses.update(state => ({ ...state, [item.planId]: res.data }));
    } catch (error) {
      this.analysisErrors.update(state => ({ ...state, [item.planId]: apiError(error).message }));
    } finally {
      this.analyzing.update(({ [item.planId]: _, ...rest }) => rest);
    }
  }
}
