import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '', component: MainLayout, children: [
      { path: '', pathMatch: 'full', redirectTo: 'admin/eventos' },
      { path: 'eventos/:slug', title: 'Evento · PlanVLC', loadComponent: () => import('./features/eventos/pages/evento-detalle-page/evento-detalle-page').then(m => m.EventoDetallePage) },
      { path: 'admin/eventos', loadChildren: () => import('./features/eventos/eventos.routes').then(m => m.EVENTOS_ROUTES) },
      { path: '**', title: 'Página no encontrada · PlanVLC', loadComponent: () => import('./features/not-found/pages/not-found-page/not-found-page').then(m => m.NotFoundPage) },
    ],
  },
];