import { Component, input, output } from '@angular/core';
import { LucideLock, LucideTrash2 } from '@lucide/angular';
import { priceText } from '../../../shop/utils/shop.utils';

// Resumen del carrito: número de entradas, total y botones. Solo UI: los importes llegan calculados
// por el backend. El pago se implementará en otra fase (checkout → pedido → pago → reservas)
@Component({
  selector: 'app-cart-summary',
  imports: [LucideLock, LucideTrash2],
  template: `
    <section class="rounded-2xl border border-gris-200 bg-superficie p-5 sm:p-6" aria-labelledby="cart-summary-title">
      <h2 id="cart-summary-title" class="text-xl font-bold text-gris-900">Resumen</h2>
      <dl class="mt-4 space-y-2 text-sm">
        <div class="flex justify-between text-gris-600">
          <dt>Entradas</dt><dd class="font-semibold text-gris-900">{{ totalItems() }}</dd>
        </div>
        <div class="flex justify-between text-gris-600">
          <dt>Subtotal</dt><dd class="font-semibold text-gris-900">{{ priceText(total()) }}</dd>
        </div>
        <div class="flex items-end justify-between border-t border-gris-200 pt-3">
          <dt class="font-bold text-gris-900">Total</dt>
          <dd class="font-display text-3xl font-extrabold text-gris-900">{{ priceText(total()) }}</dd>
        </div>
      </dl>
      @if (hasIssues()) {
        <p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">Hay entradas que ya no se pueden comprar: no cuentan en el total. Cámbialas de fecha o quítalas.</p>
      }
      <button type="button" disabled title="El pago llegará en la siguiente fase"
        class="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-marca-600 px-5 py-3 font-semibold text-white opacity-60">
        <svg lucideLock width="17" height="17"></svg> Ir al pago (próximamente)
      </button>
      <button type="button" (click)="clear.emit()" [disabled]="busy()"
        class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-gris-600 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50">
        <svg lucideTrash2 width="16" height="16"></svg> Vaciar carrito
      </button>
    </section>
  `,
})
export class CartSummary {
  totalItems = input(0);
  total = input(0);
  hasIssues = input(false);
  busy = input(false);
  clear = output<void>();

  readonly priceText = priceText;
}
