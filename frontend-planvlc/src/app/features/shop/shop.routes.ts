import { Routes } from '@angular/router';

// Tienda pública (no hace falta iniciar sesión)
export const SHOP_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'PlanVLC · Planes y eventos en Valencia',
    loadComponent: () => import('./pages/home-page/home-page').then(m => m.HomePage),
  },
  {
    // Filtros, búsqueda y página en la URL: /planes?category=<id>&search=tardeo&page=2
    path: 'planes',
    title: 'Planes · PlanVLC',
    loadComponent: () => import('./pages/shop-page/shop-page').then(m => m.ShopPage),
  },
  {
    path: 'planes/:slug',
    title: 'Plan · PlanVLC',
    loadComponent: () => import('./pages/plan-detail-page/plan-detail-page').then(m => m.PlanDetailPage),
  },
];
