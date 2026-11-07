import { Component, input, output } from '@angular/core';
import { ShopCategory } from '../../../../core/models/shop.model';
import { initial } from '../../utils/shop.utils';

// Card de una categoría (carrusel del home). Solo UI: avisa al padre al pulsarla
@Component({
  selector: 'app-category-card',
  template: `
    <button type="button" (click)="selected.emit(category())" class="group block w-full overflow-hidden rounded-2xl border border-gris-200 bg-white text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
      @if (category().coverImage; as image) {
        <img [src]="image.url" [alt]="image.alt || category().name" class="h-28 w-full object-cover" loading="lazy" />
      } @else {
        <span class="flex h-28 w-full items-center justify-center bg-gradient-to-br from-marca-100 to-marca-200 text-4xl font-extrabold text-marca-700" aria-hidden="true">{{ category().icon || initial(category().name) }}</span>
      }
      <span class="block px-4 py-3 font-semibold text-gris-900 group-hover:text-marca-700">{{ category().name }}</span>
    </button>
  `,
})
export class CategoryCard {
  category = input.required<ShopCategory>();
  selected = output<ShopCategory>();
  readonly initial = initial;
}
