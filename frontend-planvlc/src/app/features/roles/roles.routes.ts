import { Routes } from '@angular/router';

export const ROLES_ROUTES: Routes = [
  {
    path: '',
    title: 'Administrar roles · PlanVLC',
    loadComponent: () => import('./pages/role-list/role-list').then(m => m.RoleList),
  },
  {
    path: 'nuevo',
    title: 'Nuevo rol · PlanVLC',
    loadComponent: () => import('./pages/role-create/role-create').then(m => m.RoleCreate),
  },
  {
    // Ficha de solo lectura (también para roles desactivados o eliminados)
    path: ':id',
    title: 'Ver rol · PlanVLC',
    loadComponent: () => import('./pages/role-detail/role-detail').then(m => m.RoleDetail),
  },
  {
    // En el panel todo va por _id
    path: ':id/editar',
    title: 'Editar rol · PlanVLC',
    loadComponent: () => import('./pages/role-edit/role-edit').then(m => m.RoleEdit),
  },
];
