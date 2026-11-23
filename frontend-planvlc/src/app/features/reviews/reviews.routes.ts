import { Routes } from '@angular/router';

export const REVIEWS_ROUTES: Routes = [
  {
    // Opiniones de cada plan y su análisis de sentimiento con IA
    path: '',
    title: 'Opiniones · PlanVLC',
    loadComponent: () => import('./pages/reviews-page/reviews-page').then(m => m.ReviewsPage),
  },
];
