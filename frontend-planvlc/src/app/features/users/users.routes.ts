import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    title: 'Administrar usuarios · PlanVLC',
    loadComponent: () => import('./pages/user-list/user-list').then(m => m.UserList),
  },
  {
    path: 'nuevo',
    title: 'Nuevo usuario · PlanVLC',
    loadComponent: () => import('./pages/user-create/user-create').then(m => m.UserCreate),
  },
  {
    // Ficha de solo lectura (también para usuarios desactivados o eliminados)
    path: ':id',
    title: 'Ver usuario · PlanVLC',
    loadComponent: () => import('./pages/user-detail/user-detail').then(m => m.UserDetail),
  },
  {
    // En el panel todo va por _id
    path: ':id/editar',
    title: 'Editar usuario · PlanVLC',
    loadComponent: () => import('./pages/user-edit/user-edit').then(m => m.UserEdit),
  },
];
