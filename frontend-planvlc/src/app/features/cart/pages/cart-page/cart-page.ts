import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideShoppingCart } from '@lucide/angular';
import { CartItem as CartLine, UpdateCartItemPayload } from '../../../../core/models/cart.model';
import { ShopSession } from '../../../../core/models/shop.model';
import { CartService } from '../../../../core/services/cart.service';
import { ShopService } from '../../../../core/services/shop.service';
import { AlertService } from '../../../../core/services/alert.service';
import { CartStore } from '../../../../core/stores/cart.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { CartItem } from '../../components/cart-item/cart-item';
import { CartSummary } from '../../components/cart-summary/cart-summary';

// Página del carrito (/carrito, solo con sesión: authGuard). Pinta lo que hay en CartStore y guarda
// cada cambio en el backend, que devuelve el carrito ya recalculado (subtotales, total y entradas).
// Para cambiar la fecha de una línea carga las próximas fechas de cada plan del carrito
@Component({
  selector: 'app-cart-page',
  imports: [RouterLink, LucideArrowLeft, LucideShoppingCart, SkeletonLoader, ErrorState, CartItem, CartSummary],
  templateUrl: './cart-page.html',
})
export class CartPage implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly shopService = inject(ShopService);
  private readonly alerts = inject(AlertService);
  readonly store = inject(CartStore);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<string | null>(null); // línea que se está guardando
  readonly clearing = signal(false);
  // Próximas fechas de cada plan del carrito (por slug)
  readonly sessionsByPlan = signal<Record<string, ShopSession[]>>({});

  readonly planCount = computed(() => new Set(this.store.items().map(item => item.plan?._id)).size);

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);
      const res = await this.cartService.get();
      this.store.setCart(res.data);
      void this.loadSessions(res.data.items);
    } catch (error) {
      this.error.set(apiError(error).message);
    } finally {
      this.loading.set(false);
    }
  }

  // Fechas de los planes del carrito, para el selector de fecha de cada línea
  private async loadSessions(items: CartLine[]): Promise<void> {
    const slugs = [...new Set(items.map(item => item.plan?.slug).filter((slug): slug is string => !!slug))];
    const missing = slugs.filter(slug => !this.sessionsByPlan()[slug]);
    const results = await Promise.allSettled(missing.map(slug => this.shopService.getPlanSessions(slug)));
    const loaded: Record<string, ShopSession[]> = {};
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') loaded[missing[index]] = result.value.data;
    });
    this.sessionsByPlan.update(current => ({ ...current, ...loaded }));
  }

  sessionsFor(item: CartLine): ShopSession[] {
    return item.plan ? (this.sessionsByPlan()[item.plan.slug] ?? []) : [];
  }

  onQuantity(item: CartLine, quantity: number): void {
    void this.update(item, { quantity });
  }

  onSession(item: CartLine, sessionId: string): void {
    if (sessionId !== item.session?._id) void this.update(item, { sessionId });
  }

  private async update(item: CartLine, payload: UpdateCartItemPayload): Promise<void> {
    if (this.busyId()) return;
    try {
      this.busyId.set(item._id);
      const res = await this.cartService.updateItem(item._id, payload);
      this.store.setCart(res.data);
    } catch {
      // El interceptor ya muestra el error (sin plazas...). Se vuelve a pintar lo que dice el backend
      await this.load();
    } finally {
      this.busyId.set(null);
    }
  }

  async onRemove(item: CartLine): Promise<void> {
    if (this.busyId()) return;
    try {
      this.busyId.set(item._id);
      const res = await this.cartService.removeItem(item._id);
      this.store.setCart(res.data);
      this.alerts.success('Quitado del carrito');
    } catch {
      await this.load();
    } finally {
      this.busyId.set(null);
    }
  }

  async onClear(): Promise<void> {
    const confirmed = await this.alerts.confirm('Vaciar carrito', 'Se quitarán todas las entradas del carrito.', 'Vaciar');
    if (!confirmed) return;
    try {
      this.clearing.set(true);
      const res = await this.cartService.clear();
      this.store.setCart(res.data);
    } catch {
      // El interceptor ya muestra el error
    } finally {
      this.clearing.set(false);
    }
  }
}
