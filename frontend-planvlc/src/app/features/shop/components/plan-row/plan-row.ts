import { Component, input, output } from '@angular/core';
import { LucideCalendarDays, LucideMapPin, LucideTicket } from '@lucide/angular';
import { ShopPlan } from '../../../../core/models/shop.model';
import { nextDateText, planPriceText, venueText } from '../../utils/shop.utils';

// Fila de un plan (vista lista del shop). Solo UI: avisa al padre al pulsarla
@Component({
  selector: 'app-plan-row',
  imports: [LucideCalendarDays, LucideMapPin, LucideTicket],
  template: `
    <button type="button" (click)="selected.emit(plan())" class="group flex w-full gap-4 overflow-hidden rounded-2xl border border-gris-200 bg-superficie p-3 text-left shadow-xs transition hover:shadow-md sm:p-4">
      @if (plan().coverImage; as image) {
        <img [src]="image.url" [alt]="image.alt || plan().title" class="h-24 w-28 shrink-0 rounded-xl bg-gris-100 object-cover sm:h-28 sm:w-44" loading="lazy" />
      } @else {
        <span class="flex h-24 w-28 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-marca-100 to-marca-200 text-marca-500 sm:h-28 sm:w-44" aria-hidden="true"><svg lucideTicket width="32" height="32"></svg></span>
      }
      <span class="flex min-w-0 flex-1 flex-col">
        <span class="flex items-start justify-between gap-3">
          <span class="min-w-0">
            <span class="flex flex-wrap gap-1.5">
              @for (category of plan().categoryIds; track category._id) {
                <span class="rounded-full bg-marca-50 px-2 py-0.5 text-xs font-semibold text-marca-700">{{ category.name }}</span>
              }
            </span>
            <span class="mt-1.5 block truncate text-base font-bold text-gris-900 group-hover:text-marca-700 sm:text-lg">{{ plan().title }}</span>
          </span>
          <span class="shrink-0 text-sm font-bold text-marca-700 sm:text-base">{{ planPriceText(plan()) }}</span>
        </span>
        @if (plan().shortDescription) {
          <span class="mt-1 hidden line-clamp-1 text-sm text-gris-500 sm:block">{{ plan().shortDescription }}</span>
        }
        <span class="mt-auto flex flex-col gap-x-5 gap-y-1 pt-2 text-sm text-gris-600 sm:flex-row">
          <span class="flex items-center gap-1.5"><svg lucideCalendarDays width="15" height="15" class="shrink-0 text-gris-400"></svg> {{ nextDateText(plan()) }}</span>
          <span class="flex min-w-0 items-center gap-1.5"><svg lucideMapPin width="15" height="15" class="shrink-0 text-gris-400"></svg> <span class="truncate">{{ venueText(plan().venueId) }}</span></span>
        </span>
      </span>
    </button>
  `,
})
export class PlanRow {
  plan = input.required<ShopPlan>();
  selected = output<ShopPlan>();
  readonly nextDateText = nextDateText;
  readonly planPriceText = planPriceText;
  readonly venueText = venueText;
}
