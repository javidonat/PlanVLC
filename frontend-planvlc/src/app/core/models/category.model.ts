import { ImageRef } from './plan.model';

// Categoría: tipo de plan (Tardeo, Concierto, Deporte...). Backend: models/category.model.js

// Estados propios de la categoría (backend: models/constants.js → CATEGORY_STATUSES)
export type CategoryStatus = 'draft' | 'published' | 'archived';
// Grupos para agrupar las categorías (backend: CATEGORY_GROUPS)
export type CategoryGroup = 'nightlife' | 'sports' | 'activities' | 'other';

export const CATEGORY_STATUSES: { value: CategoryStatus; label: string }[] = [
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicada' },
  { value: 'archived', label: 'Archivada' },
];

export const CATEGORY_GROUPS: { value: CategoryGroup; label: string }[] = [
  { value: 'nightlife', label: 'Ocio nocturno' },
  { value: 'sports', label: 'Deporte' },
  { value: 'activities', label: 'Actividades' },
  { value: 'other', label: 'Otros' },
];

export interface Category {
  _id: string;
  name: string;
  slug: string; // lo genera el servidor a partir del nombre
  description: string;
  icon: string; // nombre de un icono para el frontend (opcional)
  group: CategoryGroup;
  coverImage?: ImageRef | null; // colección images con entityType "category"
  status: CategoryStatus;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Lo que acepta POST /api/categories y PATCH /api/categories/:id
export interface CategoryPayload {
  name: string;
  description: string;
  icon: string;
  group: CategoryGroup;
  status: CategoryStatus;
  coverImageUrl: string | null; // null = sin portada
}
