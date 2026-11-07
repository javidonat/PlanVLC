import { Component, input, output } from '@angular/core';
import { LucideMapPin } from '@lucide/angular';
import { ShopVenue } from '../../../../core/models/shop.model';

// Card de un lugar (carrusel del home). Solo UI: avisa al padre al pulsarla
@Component({
  selector: 'app-venue-card',
  imports: [LucideMapPin],
  template: `
    <button type="button" (click)="selected.emit(venue())" class="group block w-full overflow-hidden rounded-2xl border border-gris-200 bg-white text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
      @if (venue().coverImage; as image) {
        <img [src]="image.url" [alt]="image.alt || venue().name" class="h-28 w-full object-cover" loading="lazy" />
      } @else {
        <span class="flex h-28 w-full items-center justify-center bg-gradient-to-br from-gris-100 to-gris-200 text-gris-400" aria-hidden="true"><svg lucideMapPin width="32" height="32"></svg></span>
      }
      <span class="block px-4 pt-3 font-semibold text-gris-900 group-hover:text-marca-700">{{ venue().name }}</span>
      <span class="block px-4 pb-3 text-xs text-gris-500">{{ venue().neighborhood || venue().city }}</span>
    </button>
  `,
})
export class VenueCard {
  venue = input.required<ShopVenue>();
  selected = output<ShopVenue>();
}
