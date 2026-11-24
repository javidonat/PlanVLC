import { Component, input, output } from '@angular/core';
import { ShopCategory } from '../../../../core/models/shop.model';
import { initial } from '../../utils/shop.utils';

// Card de una categoría (carrusel del home). Solo UI: avisa al padre al pulsarla
@Component({
  selector: 'app-category-card',
  template: `
    <!-- Tarjeta tipo cartel: la foto ocupa todo y el nombre va encima, abajo -->
    <button type="button" (click)="selected.emit(category())" class="group/card relative block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-noche text-left">
      @if (category().coverImage; as image) {
        <img [src]="image.url" [alt]="image.alt || category().name" class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover/card:scale-105" loading="lazy" />
      } @else {
        <span class="absolute inset-0 flex items-center justify-center bg-marca-700 text-6xl font-extrabold text-white/30" aria-hidden="true">{{ category().icon || initial(category().name) }}</span>
      }
      <span class="absolute inset-0 bg-gradient-to-t from-noche/90 via-noche/10 to-transparent" aria-hidden="true"></span>
      <span class="font-display absolute inset-x-0 bottom-0 p-4 text-2xl font-extrabold leading-tight text-white transition-colors group-hover/card:text-marca-300">{{ category().name }}</span>
    </button>
  `,
})
export class CategoryCard {
  category = input.required<ShopCategory>();
  selected = output<ShopCategory>();
  readonly initial = initial;
}
