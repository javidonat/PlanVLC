import { Component, input, output } from '@angular/core';
import { ShopOrganizer } from '../../../../core/models/shop.model';
import { initial, organizerTypeText } from '../../utils/shop.utils';

// Card de un organizador (carrusel del home). Solo UI: avisa al padre al pulsarla
@Component({
  selector: 'app-organizer-card',
  template: `
    <button type="button" (click)="selected.emit(organizer())" class="group/card flex h-full w-full flex-col items-center rounded-2xl border border-gris-200 bg-superficie px-5 py-6 text-center transition-colors hover:border-marca-300">
      @if (organizer().logo; as logo) {
        <img [src]="logo.url" [alt]="logo.alt || organizer().name" class="h-20 w-20 rounded-full object-cover ring-4 ring-gris-100 transition group-hover/card:ring-marca-100" loading="lazy" />
      } @else {
        <span class="font-display flex h-20 w-20 items-center justify-center rounded-full bg-marca-100 text-3xl font-extrabold text-marca-700" aria-hidden="true">{{ initial(organizer().name) }}</span>
      }
      <span class="font-display mt-4 text-lg font-bold leading-snug text-gris-900 group-hover/card:text-marca-700">{{ organizer().name }}</span>
      <span class="mt-1 text-xs text-gris-500">{{ organizerTypeText(organizer().type) }}</span>
    </button>
  `,
})
export class OrganizerCard {
  organizer = input.required<ShopOrganizer>();
  selected = output<ShopOrganizer>();
  readonly initial = initial;
  readonly organizerTypeText = organizerTypeText;
}
