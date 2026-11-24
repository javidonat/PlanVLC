import { Component, input } from '@angular/core';
import { LucideCircleCheck, LucideCircleMinus, LucideLoaderCircle, LucideSparkles } from '@lucide/angular';
import { ReviewsAnalysis } from '../../../../core/models/ai.model';

// "Lo que opinan nuestros usuarios": resumen de todas las opiniones hecho por el agente de IA,
// con los aspectos destacados y los mejorables. Solo UI: la página pide el análisis
@Component({
  selector: 'app-reviews-ai-summary',
  imports: [LucideCircleCheck, LucideCircleMinus, LucideLoaderCircle, LucideSparkles],
  template: `
    @if (loading()) {
      <div class="flex items-center gap-2 rounded-2xl border border-gris-200 bg-superficie px-5 py-6 text-sm text-gris-500">
        <svg lucideLoaderCircle width="16" height="16" class="animate-spin"></svg> Resumiendo lo que opinan los usuarios...
      </div>
    } @else if (analysis(); as result) {
      <div class="rounded-2xl border border-gris-200 bg-superficie p-5 sm:p-6">
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <p class="leading-relaxed text-gris-700 lg:border-r lg:border-gris-200 lg:pr-6">{{ result.summary }}</p>
          <div class="grid gap-6 sm:grid-cols-2">
            <div>
              <p class="font-bold text-gris-900">Aspectos destacados</p>
              <ul class="mt-2 space-y-2 text-sm text-gris-700">
                @for (point of result.positives; track $index) {
                  <li class="flex gap-2"><svg lucideCircleCheck width="16" height="16" class="mt-0.5 shrink-0 text-emerald-600"></svg> {{ point }}</li>
                } @empty {
                  <li class="text-gris-500">Nada destacable todavía</li>
                }
              </ul>
            </div>
            <div>
              <p class="font-bold text-gris-900">Aspectos mejorables</p>
              <ul class="mt-2 space-y-2 text-sm text-gris-700">
                @for (point of result.negatives; track $index) {
                  <li class="flex gap-2"><svg lucideCircleMinus width="16" height="16" class="mt-0.5 shrink-0 text-amber-500"></svg> {{ point }}</li>
                } @empty {
                  <li class="text-gris-500">Nadie se ha quejado de nada</li>
                }
              </ul>
            </div>
          </div>
        </div>
        <p class="mt-5 flex items-center gap-1.5 border-t border-gris-200 pt-4 text-xs text-gris-500">
          <svg lucideSparkles width="14" height="14" class="text-marca-600"></svg> Resumen generado con IA a partir de las opiniones de los usuarios. Puede contener errores.
        </p>
      </div>
    }
  `,
})
export class ReviewsAiSummary {
  analysis = input<ReviewsAnalysis | null>(null);
  loading = input(false);
}
