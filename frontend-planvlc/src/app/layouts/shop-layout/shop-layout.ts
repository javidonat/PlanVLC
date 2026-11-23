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

// Layout de la parte pública (home, shop y detalle): barra superior y pie, sin menú lateral.
// Con sesión iniciada muestra el avatar (enlace al perfil) y, si es admin, el acceso al panel.
// y sus planes con like y su lista de deseos (desplegables). Sin sesión, los accesos al login y al registro
@Component({
  selector: 'app-shop-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideLayoutDashboard, LucideLogIn, LucideMapPin, ThemeToggle, SavedPlansMenu],
  template: `
    <header class="sticky top-0 z-40 border-b border-gris-200 bg-superficie/90 backdrop-blur-md">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-6">
          <a routerLink="/" class="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-gris-900" aria-label="PlanVLC, ir al inicio">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-marca-500 to-marca-700 text-white shadow-sm" aria-hidden="true"><svg lucideMapPin width="18" height="18"></svg></span>
            <span class="hidden sm:inline">Plan<span class="text-marca-600">VLC</span></span>
          </a>
          <nav class="flex items-center gap-1 text-sm font-semibold" aria-label="Navegación principal">
            <a routerLink="/planes" routerLinkActive="bg-marca-50 text-marca-700" class="rounded-xl px-3 py-2 text-gris-600 hover:bg-gris-100">Planes</a>
          </nav>
        </div>
        <div class="flex items-center gap-1">
        <app-theme-toggle [dark]="theme.theme() === 'dark'" (toggle)="theme.toggle()" />
        @if (auth.user(); as user) {
          <div class="flex items-center gap-1 text-sm font-semibold">
            <app-saved-plans-menu kind="likes" title="Planes que te gustan" [items]="savedPlans.likes()" emptyText="Dale al corazón en un plan y aparecerá aquí." />
            <app-saved-plans-menu kind="wishlist" title="Tu lista de deseos" [items]="savedPlans.wishlist()" emptyText="Guarda planes en tu lista de deseos y los tendrás aquí." />
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
          <a routerLink="/registro" class="rounded-xl bg-marca-600 px-4 py-2 text-sm font-semibold text-white hover:bg-marca-700">Registrarse</a>
        }
        </div>
      </div>
    </header>
    <main class="min-h-[calc(100vh-8rem)]"><router-outlet /></main>
    <footer class="border-t border-gris-200 py-6 text-center text-sm text-gris-500">PlanVLC · Planes y eventos en Valencia</footer>
  `,
})
export class ShopLayout {
  readonly auth = inject(AuthStore);
  readonly theme = inject(ThemeStore);
  readonly savedPlans = inject(SavedPlansStore);
  private readonly likesService = inject(LikesService);
  private readonly wishlistService = inject(WishlistService);

  constructor() {
    // Al iniciar o cerrar sesión: se cargan (o se vacían) los likes y la lista de deseos del usuario
    effect(() => {
      const userId = this.auth.user()?._id;
      untracked(() => (userId ? void this.loadSavedPlans() : this.savedPlans.clear()));
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
}
