import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideLoaderCircle, LucideSparkles, LucideStar, LucideThumbsDown, LucideThumbsUp } from '@lucide/angular';
import { CommentsSummaryItem } from '../../../../core/models/comment.model';
import { ReviewSentiment, ReviewsAnalysis } from '../../../../core/models/ai.model';

const SENTIMENTS: Record<ReviewSentiment, { label: string; classes: string }> = {
  positive: { label: 'Positivo', classes: 'bg-emerald-50 text-emerald-800' },
  mixed: { label: 'Mixto', classes: 'bg-marca-50 text-marca-700' },
  neutral: { label: 'Neutro', classes: 'bg-gris-100 text-gris-700' },
  negative: { label: 'Negativo', classes: 'bg-red-50 text-red-700' },
};

// Tarjeta de un plan en el panel de opiniones. Solo UI: pinta los datos y el análisis de la IA
// y avisa al padre (analyze). Pedir el análisis lo hace la página
@Component({
  selector: 'app-plan-reviews-card',
  imports: [RouterLink, LucideLoaderCircle, LucideSparkles, LucideStar, LucideThumbsDown, LucideThumbsUp],
  template: `
    <article class="rounded-2xl border border-gris-200 bg-superficie p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <a [routerLink]="['/planes', item().slug]" class="font-bold text-gris-900 hover:text-marca-700 hover:underline">{{ item().title }}</a>
          <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gris-500">
            <span class="flex items-center gap-1"><svg lucideStar width="14" height="14" class="fill-amber-400 text-amber-400"></svg> <span class="font-semibold text-gris-900">{{ item().average ?? '-' }}</span> de media</span>
            <span>{{ item().count }} {{ item().count === 1 ? 'opinión' : 'opiniones' }}</span>
            <span>Última: {{ dateText(item().lastCommentAt) }}</span>
          </p>
        </div>
        <button type="button" (click)="analyze.emit(item())" [disabled]="loading()"
          class="inline-flex items-center gap-2 rounded-xl border border-marca-200 bg-marca-50 px-4 py-2 text-sm font-semibold text-marca-700 transition hover:bg-marca-100 disabled:cursor-not-allowed disabled:opacity-60">
          @if (loading()) { <svg lucideLoaderCircle width="16" height="16" class="animate-spin"></svg> Analizando... }
          @else { <svg lucideSparkles width="16" height="16"></svg> {{ analysis() ? 'Volver a analizar' : 'Analizar sentimiento' }} }
        </button>
      </div>

      @if (error(); as message) {
        <p class="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">{{ message }}</p>
      }

      @if (analysis(); as result) {
        <div class="mt-4 border-t border-gris-200 pt-4">
          <div class="flex flex-wrap items-center gap-3">
            <span class="rounded-full px-3 py-1 text-sm font-bold" [class]="sentiment()?.classes">{{ sentiment()?.label }}</span>
            <div class="flex min-w-40 flex-1 items-center gap-2">
              <div class="h-2 flex-1 overflow-hidden rounded-full bg-gris-100" role="meter" aria-label="Puntuación de sentimiento" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="result.score">
                <div class="h-full rounded-full bg-marca-600" [style.width.%]="result.score"></div>
              </div>
              <span class="text-sm font-bold text-gris-900">{{ result.score }}/100</span>
            </div>
          </div>
          <p class="mt-3 text-sm text-gris-700">{{ result.summary }}</p>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-800"><svg lucideThumbsUp width="14" height="14"></svg> Lo que gusta</p>
              <ul class="mt-1 list-disc space-y-0.5 pl-5 text-sm text-gris-700">
                @for (point of result.positives; track $index) { <li>{{ point }}</li> } @empty { <li class="list-none -ml-5 text-gris-500">Nada destacable</li> }
              </ul>
            </div>
            <div>
              <p class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-700"><svg lucideThumbsDown width="14" height="14"></svg> A mejorar</p>
              <ul class="mt-1 list-disc space-y-0.5 pl-5 text-sm text-gris-700">
                @for (point of result.negatives; track $index) { <li>{{ point }}</li> } @empty { <li class="list-none -ml-5 text-gris-500">Nada destacable</li> }
              </ul>
            </div>
          </div>
        </div>
      }
    </article>
  `,
})
export class PlanReviewsCard {
  item = input.required<CommentsSummaryItem>();
  analysis = input<ReviewsAnalysis | null>(null);
  loading = input(false);
  error = input<string | null>(null);
  analyze = output<CommentsSummaryItem>();

  readonly sentiment = computed(() => {
    const result = this.analysis();
    return result ? SENTIMENTS[result.sentiment] : null;
  });

  dateText(value: string): string {
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
  }
}
