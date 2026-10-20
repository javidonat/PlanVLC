import { Routes } from '@angular/router';

export const VENUES_ROUTES: Routes = [
  {
    path: '',
    title: 'Administrar lugares · PlanVLC',
    loadComponent: () => import('./pages/venue-list/venue-list').then(m => m.VenueList),
  },
  {
    path: 'nuevo',
    title: 'Nuevo lugar · PlanVLC',
    loadComponent: () => import('./pages/venue-create/venue-create').then(m => m.VenueCreate),
  },
  {
    // Ficha de solo lectura (también para lugares desactivados o eliminados)
    path: ':id',
    title: 'Ver lugar · PlanVLC',
    loadComponent: () => import('./pages/venue-detail/venue-detail').then(m => m.VenueDetail),
  },
  {
    // En el panel todo va por _id
    path: ':id/editar',
    title: 'Editar lugar · PlanVLC',
    loadComponent: () => import('./pages/venue-edit/venue-edit').then(m => m.VenueEdit),
  },
];
