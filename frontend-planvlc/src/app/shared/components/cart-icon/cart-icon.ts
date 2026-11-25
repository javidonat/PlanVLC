import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideShoppingCart } from '@lucide/angular';

// Icono del carrito del header con el número de entradas. Solo UI: lleva a /carrito
@Component({
  selector: 'app-cart-icon',
  imports: [RouterLink, RouterLinkActive, LucideShoppingCart],
  template: `
    <a routerLink="/carrito" routerLinkActive="bg-gris-100 text-gris-900" [attr.aria-label]="'Carrito (' + count() + (count() === 1 ? ' entrada)' : ' entradas)')"
      class="relative flex size-10 items-center justify-center rounded-xl text-gris-600 transition hover:bg-gris-100 hover:text-gris-900">
      <svg lucideShoppingCart width="19" height="19"></svg>
      @if (count()) {
        <span class="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-marca-600 px-1 text-[11px] font-bold text-white ring-2 ring-superficie">{{ count() > 99 ? '99+' : count() }}</span>
      }
    </a>
  `,
})
export class CartIcon {
  count = input(0);
}
