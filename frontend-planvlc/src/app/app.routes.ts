import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { MainLayout } from './layouts/main-layout/main-layout';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { AuthStore } from './core/stores/auth.store';

// canActivate: authGuard protege todo el panel (hay que estar logueado)
// y adminGuard las secciones de administración (solo rol admin)
export const routes: Routes = [
  { path: 'login', title: 'Iniciar sesión · PlanVLC', loadComponent: () => import('./features/auth/pages/login-page/login-page').then(m => m.LoginPage) },
  {
    path: '', component: MainLayout, canActivate: [authGuard], children: [
      // Portada: el admin va al panel; el resto de usuarios, a su perfil
      { path: '', pathMatch: 'full', redirectTo: () => (inject(AuthStore).isAdmin() ? 'admin/planes' : 'perfil') },
      { path: 'perfil', loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES) },
      { path: 'admin/planes', canActivate: [adminGuard], loadChildren: () => import('./features/plans/plans.routes').then(m => m.PLANS_ROUTES) },
      { path: 'admin/sesiones', canActivate: [adminGuard], loadChildren: () => import('./features/sessions/sessions.routes').then(m => m.SESSIONS_ROUTES) },
      { path: 'admin/lugares', canActivate: [adminGuard], loadChildren: () => import('./features/venues/venues.routes').then(m => m.VENUES_ROUTES) },
      { path: 'admin/organizadores', canActivate: [adminGuard], loadChildren: () => import('./features/organizers/organizers.routes').then(m => m.ORGANIZERS_ROUTES) },
      { path: 'admin/categorias', canActivate: [adminGuard], loadChildren: () => import('./features/categories/categories.routes').then(m => m.CATEGORIES_ROUTES) },
      { path: 'admin/usuarios', canActivate: [adminGuard], loadChildren: () => import('./features/users/users.routes').then(m => m.USERS_ROUTES) },
      { path: 'admin/perfiles', canActivate: [adminGuard], loadChildren: () => import('./features/profiles/profiles.routes').then(m => m.PROFILES_ROUTES) },
      { path: 'admin/roles', canActivate: [adminGuard], loadChildren: () => import('./features/roles/roles.routes').then(m => m.ROLES_ROUTES) },
      { path: 'admin/imagenes', canActivate: [adminGuard], loadChildren: () => import('./features/images/images.routes').then(m => m.IMAGES_ROUTES) },
      { path: '**', title: 'Página no encontrada · PlanVLC', loadComponent: () => import('./features/not-found/pages/not-found-page/not-found-page').then(m => m.NotFoundPage) },
    ],
  },
];
