import { Component, ElementRef, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideBookmark, LucideHeart, LucideImage } from '@lucide/angular';
import { SavedPlanItem } from '../../../core/models/saved-plan.model';

// Icono del header con contador y desplegable con los planes guardados (likes o lista de deseos).
// Solo UI: recibe la lista ya cargada (SavedPlansStore). Abrir y cerrar el desplegable es estado de la vista
@Component({
  selector: 'app-saved-plans-menu',
  imports: [RouterLink, LucideBookmark, LucideHeart, LucideImage],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'open.set(false)',
  },
  template: `
    <div class="relative">
      <button type="button" (click)="open.set(!open())" [attr.aria-expanded]="open()" [attr.aria-label]="title() + ' (' + items().length + ')'"
        class="relative flex size-10 items-center justify-center rounded-xl text-gris-600 transition hover:bg-gris-100 hover:text-gris-900"
        [class.bg-gris-100]="open()">
        @if (kind() === 'likes') {
          <svg lucideHeart width="19" height="19"></svg>
        } @else {
          <svg lucideBookmark width="19" height="19"></svg>
        }
        @if (items().length) {
          <span class="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-bold text-white ring-2 ring-superficie"
            [class]="kind() === 'likes' ? 'bg-red-500' : 'bg-marca-600'">{{ items().length > 99 ? '99+' : items().length }}</span>
        }
      </button>

      @if (open()) {
        <div class="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gris-200 bg-superficie shadow-xl" role="dialog" [attr.aria-label]="title()">
          <p class="flex items-center justify-between border-b border-gris-200 px-4 py-3 text-sm font-bold text-gris-900">
            {{ title() }} <span class="font-semibold text-gris-500">{{ items().length }}</span>
          </p>
          @if (items().length) {
            <ul class="max-h-96 overflow-y-auto p-2">
              @for (item of items(); track item._id) {
                <li>
                  <a [routerLink]="['/planes', item.planId.slug]" (click)="open.set(false)" class="flex items-center gap-3 rounded-xl p-2 transition hover:bg-gris-50">
                    @if (item.planId.coverImage; as cover) {
                      <img [src]="cover.url" [alt]="cover.alt || item.planId.title" class="size-12 shrink-0 rounded-lg bg-gris-100 object-cover" />
                    } @else {
                      <span class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gris-100 text-gris-400"><svg lucideImage width="18" height="18"></svg></span>
                    }
                    <span class="min-w-0">
                      <span class="block truncate text-sm font-semibold text-gris-900">{{ item.planId.title }}</span>
                      <span class="block truncate text-xs text-gris-500">{{ priceText(item.planId.priceFrom) }}</span>
                    </span>
                  </a>
                </li>
              }
            </ul>
          } @else {
            <p class="px-4 py-8 text-center text-sm text-gris-500">{{ emptyText() }}</p>
          }
        </div>
      }
    </div>
  `,
})
export class SavedPlansMenu {
  private readonly element = inject(ElementRef<HTMLElement>);

  kind = input.required<'likes' | 'wishlist'>();
  title = input.required<string>();
  items = input<SavedPlanItem[]>([]);
  emptyText = input('Todavía no hay nada aquí.');

  readonly open = signal(false);

  // Clic fuera del desplegable: se cierra
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.element.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  priceText(price: number): string {
    if (price === 0) return 'Gratis';
    return 'Desde ' + new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);
  }
}
