import { ListState, Status } from './status.model';

// Un Plan es la ficha general (ej. "Tardeo Ruzafa"). NO tiene fecha, precio ni aforo:
// eso vive en cada Session del plan (ver session.model.ts).

// Relaciones tal y como llegan con populate() (backend: repos/plans.repo.js → POPULATE)
export type CategoryRef = { _id: string; name: string; slug: string };
export type VenueRef = { _id: string; name: string; city: string; neighborhood: string };
export type OrganizerRef = { _id: string; name: string; slug: string };
export type ImageRef = { _id: string; url: string; alt: string };

export interface Plan {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;

  // Relaciones: pueden llegar pobladas (objeto) o solo como id (string).
  // Por ejemplo, PATCH /active y /softdelete devuelven el plan SIN populate.
  categoryIds: (string | CategoryRef)[]; // obligatorio, 1 a 5
  venueId: string | VenueRef; // obligatorio
  organizerId: string | OrganizerRef | null; // opcional

  // Imágenes del plan (colección images con entityType "plan"). Llegan pobladas en los GET
  coverImage?: ImageRef | null; // opcional
  galleryImages?: ImageRef[]; // ordenadas por posición, máximo 10

  // Datos derivados de sus sesiones: los calcula el servidor, el frontend solo los lee
  priceFrom: number; // precio mínimo de sus sesiones (0 = gratis)
  nextSessionAt: string | null; // fecha ISO de la próxima sesión (null = sin sesiones)

  minAge: number;
  tags: string[];
  status: Status;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Lo que acepta POST /api/plans y PATCH /api/plans/:id (solo ids en las relaciones).
// slug, priceFrom, nextSessionAt, isActive y deletedAt los gestiona el servidor.
// Las imágenes se envían como URLs: el servidor crea, reordena o elimina las de "images".
export interface PlanPayload {
  title: string;
  shortDescription: string;
  description: string;
  categoryIds: string[];
  venueId: string;
  organizerId: string | null;
  coverImageUrl: string | null; // null = sin portada
  galleryImageUrls: string[]; // [] = galería vacía
  minAge: number;
  status: Status;
}

// ---------- Listado del panel: filtros, orden, vista y página (van en la URL) ----------

// Orden del listado (backend: PLAN_SORTS). Por defecto, por próxima sesión
export type PlanSort = 'date' | 'recent' | 'title' | 'price_asc' | 'price_desc' | 'popular';

export const PLAN_SORTS: { value: PlanSort; label: string }[] = [
  { value: 'date', label: 'Próxima sesión' },
  { value: 'recent', label: 'Más nuevos' },
  { value: 'title', label: 'Título (A-Z)' },
  { value: 'price_asc', label: 'Precio: de menor a mayor' },
  { value: 'price_desc', label: 'Precio: de mayor a menor' },
  { value: 'popular', label: 'Más visitados' },
];

// Tabla o tarjetas (?view=cards)
export type PlanView = 'table' | 'cards';

// En el panel las relaciones van por _id (en la tienda, por slug)
export interface PlanListFilters {
  search: string; // contiene el texto en el título
  status: Status | null;
  state: ListState | null;
  category: string | null; // _id
  organizer: string | null;
  venue: string | null;
  sort: PlanSort;
  page: number;
}

export const EMPTY_PLAN_FILTERS: PlanListFilters = {
  search: '', status: null, state: null, category: null, organizer: null, venue: null, sort: 'date', page: 1,
};
