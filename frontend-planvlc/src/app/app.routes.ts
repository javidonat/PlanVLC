import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { ShopLayout } from './layouts/shop-layout/shop-layout';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

// La parte pública (home, shop y detalle) no pide sesión.
// canActivate: authGuard protege el perfil y el panel (hay que estar logueado)
// y adminGuard las secciones de administración (solo rol admin)
export const routes: Routes = [
  { path: 'login', title: 'Iniciar sesión · PlanVLC', loadComponent: () => import('./features/auth/pages/login-page/login-page').then(m => m.LoginPage) },
  // Tienda pública: / (home), /planes (shop) y /planes/:slug (detalle)
  { path: '', component: ShopLayout, loadChildren: () => import('./features/shop/shop.routes').then(m => m.SHOP_ROUTES) },
  {
    path: '', component: MainLayout, canActivate: [authGuard], children: [
      { path: 'perfil', loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES) },
      { path: 'admin/planes', canActivate: [adminGuard], loadChildren: () => import('./features/plans/plans.routes').then(m => m.PLANS_ROUTES) },
      { path: 'admin/sesiones', canActivate: [adminGuard], loadChildren: () => import('./features/sessions/sessions.routes').then(m => m.SESSIONS_ROUTES) },
      { path: 'admin/lugares', canActivate: [adminGuard], loadChildren: () => import('./features/venues/venues.routes').then(m => m.VENUES_ROUTES) },
      { path: 'admin/organizadores', canActivate: [adminGuard], loadChildren: () => import('./features/organizers/organizers.routes').then(m => m.ORGANIZERS_ROUTES) },
      { path: 'admin/categorias', canActivate: [adminGuard], loadChildren: () => import('./features/categories/categories.routes').then(m => m.CATEGORIES_ROUTES) },
      { path: 'admin/usuarios', canActivate: [adminGuard], loadChildren: () => import('./features/users/users.routes').then(m => m.USERS_ROUTES) },
      { path: 'admin/perfiles', canActivate: [adminGuard], loadChildren: () => import('./features/profiles/profiles.routes').then(m => m.PROFILES_ROUTES) },
      { path: 'admin/roles', canActivate: [adminGuard], loadChildren: () => import('./features/roles/roles.routes').then(m => m.ROLES_ROUTES) },
    ],
  },
  // Cualquier otra dirección: página 404 (pública, con el layout de la tienda)
  {
    path: '', component: ShopLayout, children: [
      { path: '**', title: 'Página no encontrada · PlanVLC', loadComponent: () => import('./features/not-found/pages/not-found-page/not-found-page').then(m => m.NotFoundPage) },
    ],
  },
];
