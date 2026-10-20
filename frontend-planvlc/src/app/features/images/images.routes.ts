import { Routes } from '@angular/router';

export const IMAGES_ROUTES: Routes = [
  {
    path: '',
    title: 'Administrar imágenes · PlanVLC',
    loadComponent: () => import('./pages/image-list/image-list').then(m => m.ImageList),
  },
  {
    path: 'nueva',
    title: 'Nueva imagen · PlanVLC',
    loadComponent: () => import('./pages/image-create/image-create').then(m => m.ImageCreate),
  },
  {
    // Ficha de solo lectura (también para imágenes desactivadas o eliminadas)
    path: ':id',
    title: 'Ver imagen · PlanVLC',
    loadComponent: () => import('./pages/image-detail/image-detail').then(m => m.ImageDetail),
  },
  {
    // En el panel todo va por _id
    path: ':id/editar',
    title: 'Editar imagen · PlanVLC',
    loadComponent: () => import('./pages/image-edit/image-edit').then(m => m.ImageEdit),
  },
];
