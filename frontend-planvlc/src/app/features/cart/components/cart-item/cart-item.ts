import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideCalendarDays, LucideImage, LucideLoaderCircle, LucideTrash2, LucideTriangleAlert } from '@lucide/angular';
import { CartItem as CartLine } from '../../../../core/models/cart.model';
import { ShopSession } from '../../../../core/models/shop.model';
import { QuantityStepper } from '../../../../shared/components/quantity-stepper/quantity-stepper';
import { priceText, sessionTimeText } from '../../../shop/utils/shop.utils';

// Una línea del carrito: foto, plan, fecha (se puede cambiar por otra del mismo plan), cantidad y subtotal.
// Solo UI: avisa al padre (quantityChange, sessionChange, remove). Guardar los cambios lo hace la página
@Component({
  selector: 'app-cart-item',
  imports: [RouterLink, LucideCalendarDays, LucideImage, LucideLoaderCircle, LucideTrash2, LucideTriangleAlert, QuantityStepper],
  template: `
    <article class="flex gap-4 rounded-2xl border bg-superficie p-4 transition sm:p-5"
      [class]="item().available ? 'border-gris-200' : 'border-red-200'" [class.opacity-60]="busy()">
      <a [routerLink]="planLink()" class="shrink-0">
        @if (item().plan?.coverImage; as cover) {
          <img [src]="cover.url" [alt]="cover.alt || item().plan?.title" class="size-20 rounded-xl bg-gris-100 object-cover sm:size-28" />
        } @else {
          <span class="flex size-20 items-center justify-center rounded-xl bg-gris-100 text-gris-400 sm:size-28"><svg lucideImage width="22" height="22"></svg></span>
        }
      </a>

      <div class="flex min-w-0 flex-1 flex-col gap-3">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <a [routerLink]="planLink()" class="font-bold text-gris-900 hover:text-marca-700 hover:underline">{{ item().plan?.title ?? 'Plan no disponible' }}</a>
            <p class="mt-0.5 text-sm text-gris-500">{{ priceText(item().unitPrice) }} / entrada</p>
          </div>
          <button type="button" (click)="remove.emit()" [disabled]="busy()" aria-label="Quitar del carrito"
            class="shrink-0 rounded-lg p-2 text-gris-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50">
            <svg lucideTrash2 width="18" height="18"></svg>
          </button>
        </div>

        <!-- Fecha: si el plan tiene más fechas, se puede cambiar aquí -->
        <label class="flex items-center gap-2 text-sm text-gris-700">
          <svg lucideCalendarDays width="16" height="16" class="shrink-0 text-gris-400"></svg>
          <span class="sr-only">Fecha</span>
          @if (sessions().length > 1) {
            <select (change)="sessionChange.emit($any($event.target).value)" [disabled]="busy()"
              class="h-9 min-w-0 max-w-full flex-1 rounded-lg border border-gris-200 bg-superficie px-2 text-sm text-gris-800 outline-none focus:border-marca-500 sm:flex-none">
              @for (session of sessions(); track session._id) {
                <option [value]="session._id" [selected]="session._id === item().session?._id" [disabled]="session.stock === 0">
                  {{ sessionTimeText(session) }} · {{ priceText(session.price) }}{{ session.stock === 0 ? ' · agotada' : '' }}
                </option>
              }
            </select>
          } @else if (item().session; as session) {
            <span>{{ sessionTimeText(session) }}</span>
          }
        </label>

        @if (item().issue; as issue) {
          <p class="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"><svg lucideTriangleAlert width="16" height="16" class="shrink-0"></svg> {{ issue }}</p>
        }

        <div class="flex flex-wrap items-center justify-between gap-3">
          <app-quantity-stepper [value]="item().quantity" [max]="maxQuantity()" [disabled]="busy()" label="Entradas" (valueChange)="quantityChange.emit($event)" />
          <p class="flex items-center gap-2 text-lg font-extrabold text-gris-900">
            @if (busy()) { <svg lucideLoaderCircle width="16" height="16" class="animate-spin text-gris-400"></svg> }
            {{ priceText(item().subtotal) }}
          </p>
        </div>
      </div>
    </article>
  `,
})
export class CartItem {
  item = input.required<CartLine>();
  sessions = input<ShopSession[]>([]); // fechas del plan para cambiarla
  limit = input(10); // máximo de entradas por línea
  busy = input(false);
  quantityChange = output<number>();
  sessionChange = output<string>();
  remove = output<void>();

  readonly priceText = priceText;
  readonly sessionTimeText = sessionTimeText;
  readonly planLink = computed(() => (this.item().plan ? ['/planes', this.item().plan!.slug] : ['/planes']));
  // No se puede pedir más de las plazas que quedan (si ya hay más de las que quedan, solo se puede bajar)
  readonly maxQuantity = computed(() => Math.max(1, Math.min(this.limit(), this.item().session?.stock ?? Infinity)));
}
