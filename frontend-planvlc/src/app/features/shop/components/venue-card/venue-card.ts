import { Component, input, output } from '@angular/core';
import { LucideMapPin } from '@lucide/angular';
import { ShopVenue } from '../../../../core/models/shop.model';

// Card de un lugar (carrusel del home). Solo UI: avisa al padre al pulsarla
@Component({
  selector: 'app-venue-card',
  imports: [LucideMapPin],
  template: `
    <button type="button" (click)="selected.emit(venue())" class="group/card block w-full text-left">
      <span class="block overflow-hidden rounded-2xl bg-gris-100">
        @if (venue().coverImage; as image) {
          <img [src]="image.url" [alt]="image.alt || venue().name" class="aspect-[4/3] w-full object-cover transition duration-500 group-hover/card:scale-105" loading="lazy" />
        } @else {
          <span class="flex aspect-[4/3] w-full items-center justify-center text-gris-400" aria-hidden="true"><svg lucideMapPin width="32" height="32"></svg></span>
        }
      </span>
      <span class="font-display mt-3 block text-lg font-bold leading-snug text-gris-900 group-hover/card:text-marca-700">{{ venue().name }}</span>
      <span class="mt-0.5 flex items-center gap-1 text-sm text-gris-500"><svg lucideMapPin width="14" height="14" class="shrink-0"></svg> {{ venue().neighborhood || venue().city }}</span>
    </button>
  `,
})
export class VenueCard {
  venue = input.required<ShopVenue>();
  selected = output<ShopVenue>();
}
