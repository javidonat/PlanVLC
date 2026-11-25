import { Component, effect, inject, untracked } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideLayoutDashboard, LucideLogIn, LucideMapPin } from '@lucide/angular';
import { AuthStore } from '../../core/stores/auth.store';
import { ThemeStore } from '../../core/stores/theme.store';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';
import { SavedPlansMenu } from '../../shared/components/saved-plans-menu/saved-plans-menu';
import { SavedPlansStore } from '../../core/stores/saved-plans.store';
import { LikesService } from '../../core/services/likes.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartIcon } from '../../shared/components/cart-icon/cart-icon';
import { CartStore } from '../../core/stores/cart.store';
import { CartService } from '../../core/services/cart.service';

// Layout de la parte pública (home, shop y detalle): barra superior y pie, sin menú lateral.
// Con sesión iniciada muestra el avatar (enlace al perfil) y, si es admin, el acceso al panel.
// sus planes con like y su lista de deseos (desplegables) y el carrito con el número de entradas. Sin sesión, los accesos al login y al registro
@Component({
  selector: 'app-shop-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideLayoutDashboard, LucideLogIn, LucideMapPin, ThemeToggle, SavedPlansMenu, CartIcon],
  template: `
    <header class="sticky top-0 z-40 border-b border-gris-200/80 bg-superficie/85 backdrop-blur-md">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-6">
          <a routerLink="/" class="font-display flex items-center gap-2 text-2xl font-extrabold text-gris-900" aria-label="PlanVLC, ir al inicio">
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-marca-600 text-white" aria-hidden="true"><svg lucideMapPin width="18" height="18"></svg></span>
            <span class="hidden sm:inline">PlanVLC</span>
          </a>
          <nav class="flex items-center gap-1 text-sm font-semibold" aria-label="Navegación principal">
            <a routerLink="/planes" routerLinkActive="bg-marca-50 text-marca-700" class="rounded-full px-4 py-2 text-gris-600 hover:bg-gris-100">Planes</a>
          </nav>
        </div>
        <div class="flex items-center gap-1">
        <app-theme-toggle [dark]="theme.theme() === 'dark'" (toggle)="theme.toggle()" />
        @if (auth.user(); as user) {
          <div class="flex items-center gap-1 text-sm font-semibold">
            <app-saved-plans-menu kind="likes" title="Planes que te gustan" [items]="savedPlans.likes()" emptyText="Dale al corazón en un plan y aparecerá aquí." />
            <app-saved-plans-menu kind="wishlist" title="Tu lista de deseos" [items]="savedPlans.wishlist()" emptyText="Guarda planes en tu lista de deseos y los tendrás aquí." />
            <app-cart-icon [count]="cart.totalItems()" />
            @if (auth.isAdmin()) {
              <a routerLink="/admin/planes" class="flex items-center gap-2 rounded-xl px-3 py-2 text-gris-600 hover:bg-gris-100"><svg lucideLayoutDashboard width="17" height="17"></svg><span class="hidden sm:inline">Panel</span></a>
            }
            <a routerLink="/perfil" class="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-3 text-gris-700 hover:bg-gris-100">
              @if (user.avatar) {
                <img [src]="user.avatar" alt="" class="h-8 w-8 rounded-full bg-marca-100 object-cover" />
              } @else {
                <span class="flex h-8 w-8 items-center justify-center rounded-full bg-marca-100 text-xs font-bold text-marca-700" aria-hidden="true">{{ auth.initials() }}</span>
              }
              <span class="hidden md:inline">{{ user.name }}</span>
            </a>
          </div>
        } @else {
          <a routerLink="/login" class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gris-700 hover:bg-gris-100"><svg lucideLogIn width="17" height="17"></svg><span class="hidden sm:inline">Iniciar sesión</span></a>
          <a routerLink="/registro" class="rounded-full bg-marca-600 px-4 py-2 text-sm font-semibold text-white hover:bg-marca-700">Registrarse</a>
        }
        </div>
      </div>
    </header>
    <main class="min-h-[calc(100vh-8rem)]"><router-outlet /></main>
    <footer class="mt-8 bg-noche text-sm text-white/60">
      <div class="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div class="flex items-center gap-3">
          <a routerLink="/" class="font-display flex items-center gap-2 text-xl font-extrabold text-white" aria-label="PlanVLC, ir al inicio">
            <span class="flex h-7 w-7 items-center justify-center rounded-full bg-marca-600" aria-hidden="true"><svg lucideMapPin width="14" height="14"></svg></span>
            PlanVLC
          </a>
          <span class="hidden h-4 w-px bg-white/20 sm:block" aria-hidden="true"></span>
          <span class="hidden sm:inline">Planes y eventos en Valencia</span>
        </div>
        <nav class="flex items-center gap-5" aria-label="Pie de página">
          <a routerLink="/planes" class="hover:text-white">Ver planes</a>
          <span>© {{ year }} PlanVLC</span>
        </nav>
      </div>
    </footer>
  `,
})
export class ShopLayout {
  readonly auth = inject(AuthStore);
  readonly theme = inject(ThemeStore);
  readonly savedPlans = inject(SavedPlansStore);
  readonly year = new Date().getFullYear();
  private readonly likesService = inject(LikesService);
  private readonly wishlistService = inject(WishlistService);
  readonly cart = inject(CartStore);
  private readonly cartService = inject(CartService);

  constructor() {
    // Al iniciar o cerrar sesión: se cargan (o se vacían) los likes, la lista de deseos y el carrito del usuario
    effect(() => {
      const userId = this.auth.user()?._id;
      untracked(() => {
        if (userId) {
          void this.loadSavedPlans();
          void this.loadCart();
        } else {
          this.savedPlans.clear();
          this.cart.clear();
        }
      });
    });
  }

  private async loadSavedPlans(): Promise<void> {
    try {
      const [likes, wishlist] = await Promise.all([this.likesService.getMine(), this.wishlistService.getMine()]);
      this.savedPlans.setLikes(likes.data);
      this.savedPlans.setWishlist(wishlist.data);
    } catch {
      // Sin las listas, los iconos salen vacíos: el resto de la web sigue funcionando
    }
  }

  private async loadCart(): Promise<void> {
    try {
      this.cart.setCart((await this.cartService.get()).data);
    } catch {
      // Sin carrito, el icono sale a 0: el resto de la web sigue funcionando
    }
  }
}
