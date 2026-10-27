import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    title: 'Mi perfil · PlanVLC',
    loadComponent: () => import('./pages/profile-page/profile-page').then(m => m.ProfilePage),
  },
];
