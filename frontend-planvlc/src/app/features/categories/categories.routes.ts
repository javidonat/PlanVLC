import { Routes } from '@angular/router';

export const CATEGORIES_ROUTES: Routes = [
  {
    path: '',
    title: 'Administrar categorías · PlanVLC',
    loadComponent: () => import('./pages/category-list/category-list').then(m => m.CategoryList),
  },
  {
    path: 'nueva',
    title: 'Nueva categoría · PlanVLC',
    loadComponent: () => import('./pages/category-create/category-create').then(m => m.CategoryCreate),
  },
  {
    // Ficha de solo lectura (también para categorías desactivadas o eliminadas)
    path: ':id',
    title: 'Ver categoría · PlanVLC',
    loadComponent: () => import('./pages/category-detail/category-detail').then(m => m.CategoryDetail),
  },
  {
    // Se usa el _id (no el slug): el slug cambia si se edita el nombre
    path: ':id/editar',
    title: 'Editar categoría · PlanVLC',
    loadComponent: () => import('./pages/category-edit/category-edit').then(m => m.CategoryEdit),
  },
];
