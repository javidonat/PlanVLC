import { Routes } from '@angular/router';

export const SESSIONS_ROUTES: Routes = [
  {
    path: '',
    title: 'Administrar sesiones · PlanVLC',
    loadComponent: () => import('./pages/session-list/session-list').then(m => m.SessionList),
  },
  {
    path: 'nueva',
    title: 'Nueva sesión · PlanVLC',
    loadComponent: () => import('./pages/session-create/session-create').then(m => m.SessionCreate),
  },
  {
    // Ficha de solo lectura (también para sesiones desactivadas o eliminadas)
    path: ':id',
    title: 'Ver sesión · PlanVLC',
    loadComponent: () => import('./pages/session-detail/session-detail').then(m => m.SessionDetail),
  },
  {
    // En el panel todo va por _id (el SKU cambia si se cambia la fecha de inicio)
    path: ':id/editar',
    title: 'Editar sesión · PlanVLC',
    loadComponent: () => import('./pages/session-edit/session-edit').then(m => m.SessionEdit),
  },
];
