import { Routes } from '@angular/router';

export const EVENTOS_ROUTES: Routes = [
  {
    path: '',
    title: 'Administrar eventos · PlanVLC',
    loadComponent: () => import('./pages/eventos-admin/eventos-admin').then(m => m.EventosAdmin),
  },
  {
    path: 'nuevo',
    title: 'Nuevo evento · PlanVLC',
    loadComponent: () => import('./pages/evento-editor/evento-editor').then(m => m.EventoEditor),
  },
  {
    path: ':id/editar',
    title: 'Editar evento · PlanVLC',
    loadComponent: () => import('./pages/evento-editor/evento-editor').then(m => m.EventoEditor),
  },
];
