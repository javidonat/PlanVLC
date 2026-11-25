import { Routes } from '@angular/router';

export const CART_ROUTES: Routes = [
  {
    path: '',
    title: 'Tu carrito · PlanVLC',
    loadComponent: () => import('./pages/cart-page/cart-page').then(m => m.CartPage),
  },
];
