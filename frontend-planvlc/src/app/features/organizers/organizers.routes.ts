import { Routes } from '@angular/router';

export const ORGANIZERS_ROUTES: Routes = [
  {
    path: '',
    title: 'Administrar organizadores · PlanVLC',
    loadComponent: () => import('./pages/organizer-list/organizer-list').then(m => m.OrganizerList),
  },
  {
    path: 'nuevo',
    title: 'Nuevo organizador · PlanVLC',
    loadComponent: () => import('./pages/organizer-create/organizer-create').then(m => m.OrganizerCreate),
  },
  {
    // Ficha de solo lectura (también para organizadores desactivados o eliminados)
    path: ':id',
    title: 'Ver organizador · PlanVLC',
    loadComponent: () => import('./pages/organizer-detail/organizer-detail').then(m => m.OrganizerDetail),
  },
  {
    // Se usa el _id (no el slug): el slug cambia si se edita el nombre
    path: ':id/editar',
    title: 'Editar organizador · PlanVLC',
    loadComponent: () => import('./pages/organizer-edit/organizer-edit').then(m => m.OrganizerEdit),
  },
];
