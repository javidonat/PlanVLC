import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '', component: MainLayout, children: [
      { path: '', pathMatch: 'full', redirectTo: 'admin/planes' },
      { path: 'admin/planes', loadChildren: () => import('./features/plans/plans.routes').then(m => m.PLANS_ROUTES) },
      { path: '**', title: 'Página no encontrada · PlanVLC', loadComponent: () => import('./features/not-found/pages/not-found-page/not-found-page').then(m => m.NotFoundPage) },
    ],
  },
];
