import { Injectable, computed, signal } from '@angular/core';
import { Cart, EMPTY_CART } from '../models/cart.model';

// Estado del carrito del usuario de la sesión. Solo guarda datos: lo carga ShopLayout al iniciar sesión
// (y lo vacía al cerrarla), y lo actualizan el detalle del plan y la página del carrito con la respuesta
// del backend (que trae el carrito ya recalculado). Así el icono del header siempre está al día
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly _cart = signal<Cart>(EMPTY_CART);
  private readonly _loaded = signal(false);

  readonly cart = this._cart.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly items = computed(() => this._cart().items);
  readonly totalItems = computed(() => this._cart().totalItems);
  readonly total = computed(() => this._cart().total);
  readonly isEmpty = computed(() => this._cart().items.length === 0);

  setCart(cart: Cart): void {
    this._cart.set(cart);
    this._loaded.set(true);
  }

  clear(): void {
    this._cart.set(EMPTY_CART);
    this._loaded.set(false);
  }
}
