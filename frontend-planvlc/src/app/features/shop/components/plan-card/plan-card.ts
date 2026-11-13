import { Component, input, output } from '@angular/core';
import { LucideCalendarDays, LucideMapPin, LucideTicket } from '@lucide/angular';
import { ShopPlan } from '../../../../core/models/shop.model';
import { nextDateText, planPriceText, venueText } from '../../utils/shop.utils';

// Card de un plan (listado del shop). Solo UI: avisa al padre al pulsarla
@Component({
  selector: 'app-plan-card',
  imports: [LucideCalendarDays, LucideMapPin, LucideTicket],
  template: `
    <button type="button" (click)="selected.emit(plan())" class="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-gris-200 bg-superficie text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
      <span class="relative block overflow-hidden">
        @if (plan().coverImage; as image) {
          <img [src]="image.url" [alt]="image.alt || plan().title" class="aspect-[16/10] w-full bg-gris-100 object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
        } @else {
          <span class="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-marca-100 to-marca-200 text-marca-500" aria-hidden="true"><svg lucideTicket width="40" height="40"></svg></span>
        }
        <span class="absolute right-3 top-3 rounded-full bg-superficie/95 px-3 py-1 text-sm font-bold text-marca-700 shadow-sm">{{ planPriceText(plan()) }}</span>
      </span>
      <span class="flex flex-1 flex-col p-5">
        <span class="flex flex-wrap gap-1.5">
          @for (category of plan().categoryIds; track category._id) {
            <span class="rounded-full bg-marca-50 px-2.5 py-1 text-xs font-semibold text-marca-700">{{ category.name }}</span>
          }
        </span>
        <span class="mt-3 text-lg font-bold text-gris-900 group-hover:text-marca-700">{{ plan().title }}</span>
        @if (plan().shortDescription) {
          <span class="mb-4 mt-1 line-clamp-2 text-sm text-gris-500">{{ plan().shortDescription }}</span>
        }
        <span class="mt-auto space-y-1.5 border-t border-gris-100 pt-4 text-sm text-gris-600">
          <span class="flex items-center gap-2"><svg lucideCalendarDays width="16" height="16" class="shrink-0 text-gris-400"></svg> {{ nextDateText(plan()) }}</span>
          <span class="flex items-center gap-2"><svg lucideMapPin width="16" height="16" class="shrink-0 text-gris-400"></svg> {{ venueText(plan().venueId) }}</span>
        </span>
      </span>
    </button>
  `,
})
export class PlanCard {
  plan = input.required<ShopPlan>();
  selected = output<ShopPlan>();
  readonly nextDateText = nextDateText;
  readonly planPriceText = planPriceText;
  readonly venueText = venueText;
}
