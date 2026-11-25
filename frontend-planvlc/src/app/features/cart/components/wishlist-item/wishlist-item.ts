import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideHeart, LucideImage } from '@lucide/angular';
import { SavedPlan } from '../../../../core/models/saved-plan.model';
import { priceText } from '../../../shop/utils/shop.utils';

// Un plan de la wishlist (un plan con like): foto, título, precio desde y el corazón para quitarlo.
// Solo UI: avisa al padre (remove). Quitar el like lo hace la página
@Component({
  selector: 'app-wishlist-item',
  imports: [RouterLink, LucideHeart, LucideImage],
  template: `
    <article class="flex gap-4 rounded-2xl border border-gris-200 bg-superficie p-4 transition sm:p-5" [class.opacity-60]="busy()">
      <a [routerLink]="['/planes', plan().slug]" class="shrink-0">
        @if (plan().coverImage; as cover) {
          <img [src]="cover.url" [alt]="cover.alt || plan().title" class="size-20 rounded-xl bg-gris-100 object-cover sm:size-28" />
        } @else {
          <span class="flex size-20 items-center justify-center rounded-xl bg-gris-100 text-gris-400 sm:size-28"><svg lucideImage width="22" height="22"></svg></span>
        }
      </a>
      <div class="flex min-w-0 flex-1 items-start justify-between gap-3">
        <div class="min-w-0">
          <a [routerLink]="['/planes', plan().slug]" class="font-bold text-gris-900 hover:text-marca-700 hover:underline">{{ plan().title }}</a>
          @if (plan().shortDescription) {
            <p class="mt-0.5 line-clamp-2 text-sm text-gris-500">{{ plan().shortDescription }}</p>
          }
          <p class="mt-2 text-sm font-semibold text-gris-900">{{ plan().priceFrom === 0 ? 'Gratis' : 'Desde ' + priceText(plan().priceFrom) }}</p>
        </div>
        <button type="button" (click)="remove.emit()" [disabled]="busy()" aria-label="Quitar de la wishlist"
          class="shrink-0 rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50">
          <svg lucideHeart width="18" height="18" class="fill-current"></svg>
        </button>
      </div>
    </article>
  `,
})
export class WishlistItem {
  plan = input.required<SavedPlan>();
  busy = input(false);
  remove = output<void>();

  readonly priceText = priceText;
}
