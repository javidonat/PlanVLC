import { Routes } from '@angular/router';

export const PROFILES_ROUTES: Routes = [
  {
    path: '',
    title: 'Administrar perfiles · PlanVLC',
    loadComponent: () => import('./pages/profile-list/profile-list').then(m => m.ProfileList),
  },
  {
    // Los perfiles van por el _id de su usuario (PATCH /api/profiles/:userId)
    path: ':userId/editar',
    title: 'Editar perfil · PlanVLC',
    loadComponent: () => import('./pages/profile-edit/profile-edit').then(m => m.ProfileEdit),
  },
];
