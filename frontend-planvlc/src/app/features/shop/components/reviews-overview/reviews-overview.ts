import { Component, computed, input } from '@angular/core';
import { LucideStar, LucideThumbsUp } from '@lucide/angular';
import { CommentStats } from '../../../../core/models/comment.model';

// Resumen gráfico de las valoraciones de un plan: media con estrellas, % que lo recomienda
// y barras con cuántas opiniones hay de cada estrella. Solo UI: recibe las stats del backend
@Component({
  selector: 'app-reviews-overview',
  imports: [LucideStar, LucideThumbsUp],
  template: `
    <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
      <div class="flex flex-col items-center justify-center rounded-2xl border border-gris-200 bg-superficie px-3 py-6 text-center">
        <p class="text-4xl font-extrabold sm:text-5xl tracking-tight text-gris-900">{{ averageText() }}</p>
        <div class="mt-2 flex" [attr.aria-label]="'Media: ' + (stats().average ?? 0) + ' de 5'">
          @for (star of stars; track star) {
            <svg lucideStar width="18" height="18" [class]="star <= rounded() ? 'fill-amber-400 text-amber-400' : 'text-gris-300'"></svg>
          }
        </div>
        <p class="mt-2 text-sm text-gris-500">{{ stats().count }} {{ stats().count === 1 ? 'opinión' : 'opiniones' }}</p>
      </div>

      <div class="flex flex-col items-center justify-center rounded-2xl border border-gris-200 bg-superficie px-3 py-6 text-center">
        <p class="text-4xl font-extrabold sm:text-5xl tracking-tight text-gris-900">{{ stats().recommendPercent ?? 0 }}%</p>
        <p class="mt-2 flex items-center gap-1.5 font-semibold text-gris-800"><svg lucideThumbsUp width="16" height="16" class="text-emerald-600"></svg> Lo recomiendan</p>
        <p class="mt-1 text-sm text-gris-500">{{ recommended() }} de {{ stats().count }} le dan 4 o 5 estrellas</p>
      </div>

      <ul class="col-span-2 flex flex-col justify-center gap-2 rounded-2xl border border-gris-200 bg-superficie px-5 py-4 lg:col-span-1" aria-label="Opiniones por estrellas">
        @for (star of starsDesc; track star) {
          <li class="flex items-center gap-3 text-sm">
            <span class="flex w-8 shrink-0 items-center gap-1 font-semibold text-gris-700">{{ star }} <svg lucideStar width="13" height="13" class="fill-amber-400 text-amber-400"></svg></span>
            <span class="h-2.5 flex-1 overflow-hidden rounded-full bg-gris-100">
              <span class="block h-full rounded-full bg-amber-400 transition-[width]" [style.width.%]="percent(star)"></span>
            </span>
            <span class="w-8 shrink-0 text-right tabular-nums text-gris-500">{{ stats().distribution[star] }}</span>
          </li>
        }
      </ul>
    </div>
  `,
})
export class ReviewsOverview {
  stats = input.required<CommentStats>();

  readonly stars = [1, 2, 3, 4, 5] as const;
  readonly starsDesc = [5, 4, 3, 2, 1] as const;
  readonly rounded = computed(() => Math.round(this.stats().average ?? 0));
  readonly averageText = computed(() => this.stats().average?.toFixed(1).replace('.', ',') ?? '-'); // 4 → "4,0"
  readonly recommended = computed(() => this.stats().distribution[5] + this.stats().distribution[4]);

  percent(star: 1 | 2 | 3 | 4 | 5): number {
    const count = this.stats().count;
    return count ? (this.stats().distribution[star] / count) * 100 : 0;
  }
}
