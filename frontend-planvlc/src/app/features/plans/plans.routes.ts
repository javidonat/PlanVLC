import { Routes } from '@angular/router';

export const PLANS_ROUTES: Routes = [
  {
    path: '',
    title: 'Administrar planes · PlanVLC',
    loadComponent: () => import('./pages/plan-list/plan-list').then(m => m.PlanList),
  },
  {
    path: 'nuevo',
    title: 'Nuevo plan · PlanVLC',
    loadComponent: () => import('./pages/plan-create/plan-create').then(m => m.PlanCreate),
  },
  {
    // Se usa el _id (no el slug): el slug cambia si se edita el título
    path: ':id/editar',
    title: 'Editar plan · PlanVLC',
    loadComponent: () => import('./pages/plan-edit/plan-edit').then(m => m.PlanEdit),
  },
];
