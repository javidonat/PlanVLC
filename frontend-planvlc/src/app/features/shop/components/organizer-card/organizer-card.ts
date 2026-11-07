import { Component, input, output } from '@angular/core';
import { ShopOrganizer } from '../../../../core/models/shop.model';
import { initial, organizerTypeText } from '../../utils/shop.utils';

// Card de un organizador (carrusel del home). Solo UI: avisa al padre al pulsarla
@Component({
  selector: 'app-organizer-card',
  template: `
    <button type="button" (click)="selected.emit(organizer())" class="group flex h-full w-full flex-col items-center rounded-2xl border border-gris-200 bg-white p-5 text-center shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
      @if (organizer().logo; as logo) {
        <img [src]="logo.url" [alt]="logo.alt || organizer().name" class="h-16 w-16 rounded-full border border-gris-200 object-cover" loading="lazy" />
      } @else {
        <span class="flex h-16 w-16 items-center justify-center rounded-full bg-marca-100 text-2xl font-bold text-marca-700" aria-hidden="true">{{ initial(organizer().name) }}</span>
      }
      <span class="mt-3 font-semibold text-gris-900 group-hover:text-marca-700">{{ organizer().name }}</span>
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
