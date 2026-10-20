// Imagen de cualquier entidad (portada, galería, logo o avatar). Backend: models/image.model.js

// A qué puede pertenecer una imagen (backend: models/constants.js → IMAGE_ENTITY_TYPES)
export type ImageEntityType = 'plan' | 'venue' | 'category' | 'organizer' | 'user';
// Qué es la imagen (backend: IMAGE_TYPES)
export type ImageType = 'cover' | 'gallery' | 'logo' | 'avatar';

// Cada entidad solo admite sus tipos (un plan no tiene avatar, un usuario no tiene galería...)
export const IMAGE_ENTITY_TYPES: { value: ImageEntityType; label: string; types: ImageType[] }[] = [
  { value: 'plan', label: 'Plan', types: ['cover', 'gallery'] },
  { value: 'venue', label: 'Lugar', types: ['cover', 'gallery'] },
  { value: 'category', label: 'Categoría', types: ['cover'] },
  { value: 'organizer', label: 'Organizador', types: ['logo'] },
  { value: 'user', label: 'Usuario', types: ['avatar'] },
];

export const IMAGE_TYPES: { value: ImageType; label: string }[] = [
  { value: 'cover', label: 'Portada' },
  { value: 'gallery', label: 'Galería' },
  { value: 'logo', label: 'Logo' },
  { value: 'avatar', label: 'Avatar' },
];

export function imageEntityTypeLabel(entityType: ImageEntityType): string {
  return IMAGE_ENTITY_TYPES.find(e => e.value === entityType)?.label ?? entityType;
}

export function imageTypeLabel(type: ImageType): string {
  return IMAGE_TYPES.find(t => t.value === type)?.label ?? type;
}

export interface Image {
  _id: string;
  url: string;
  alt: string;
  entityType: ImageEntityType;
  entityId: string;
  entityName: string | null; // nombre del plan, lugar, categoría... (lo añade el servidor)
  type: ImageType;
  position: number; // orden dentro de la galería
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Lo que acepta POST /api/images y PATCH /api/images/:id (en el PATCH la entidad no se cambia)
export interface ImagePayload {
  url: string;
  alt: string;
  entityType: ImageEntityType;
  entityId: string;
  type: ImageType;
  position: number;
}

// Opción del desplegable de entidades del formulario
export type EntityOption = { _id: string; name: string };
export type EntityOptions = Record<ImageEntityType, EntityOption[]>;
