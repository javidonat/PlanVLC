import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '', component: MainLayout, children: [
      { path: '', pathMatch: 'full', redirectTo: 'admin/planes' },
      { path: 'admin/planes', loadChildren: () => import('./features/plans/plans.routes').then(m => m.PLANS_ROUTES) },
      { path: 'admin/sesiones', loadChildren: () => import('./features/sessions/sessions.routes').then(m => m.SESSIONS_ROUTES) },
      { path: 'admin/lugares', loadChildren: () => import('./features/venues/venues.routes').then(m => m.VENUES_ROUTES) },
      { path: 'admin/organizadores', loadChildren: () => import('./features/organizers/organizers.routes').then(m => m.ORGANIZERS_ROUTES) },
      { path: 'admin/categorias', loadChildren: () => import('./features/categories/categories.routes').then(m => m.CATEGORIES_ROUTES) },
      { path: 'admin/usuarios', loadChildren: () => import('./features/users/users.routes').then(m => m.USERS_ROUTES) },
      { path: 'admin/roles', loadChildren: () => import('./features/roles/roles.routes').then(m => m.ROLES_ROUTES) },
      { path: 'admin/imagenes', loadChildren: () => import('./features/images/images.routes').then(m => m.IMAGES_ROUTES) },
      { path: '**', title: 'Página no encontrada · PlanVLC', loadComponent: () => import('./features/not-found/pages/not-found-page/not-found-page').then(m => m.NotFoundPage) },
    ],
  },
];
