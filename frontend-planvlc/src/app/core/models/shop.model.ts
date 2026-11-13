import { ApiListResponse } from './api.model';
import { CategoryRef, ImageRef, OrganizerRef } from './plan.model';
import { OrganizerType } from './organizer.model';

// Tienda pública (home, shop y detalle). Backend: routes/shop.routes.js (no piden token)

// Carruseles del home y opciones de los filtros
export interface ShopCategory {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  coverImage?: ImageRef | null;
}

export interface ShopOrganizer {
  _id: string;
  name: string;
  slug: string;
  type: OrganizerType;
  description: string;
  logo?: ImageRef | null;
}

export interface ShopVenue {
  _id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string;
  coverImage?: ImageRef | null;
}

// Plan tal y como llega a la tienda: las relaciones siempre pobladas
export type ShopVenueRef = { _id: string; name: string; slug: string; address: string; city: string; neighborhood: string };

export interface ShopPlan {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryIds: CategoryRef[];
  organizerId: OrganizerRef | null;
  venueId: ShopVenueRef;
  coverImage?: ImageRef | null;
  galleryImages?: ImageRef[]; // solo en el detalle
  priceFrom: number; // 0 = gratis
  nextSessionAt: string | null;
  minAge: number;
  tags: string[];
}

// Sesión (variante) que se puede elegir en el detalle. La reserva llegará en otra fase
export interface ShopSession {
  _id: string;
  sku: string;
  startDateTime: string;
  endDateTime: string | null;
  price: number;
  currency: string;
  capacity: number | null; // null = sin límite
  stock: number | null; // plazas libres; null = sin límite
}

// Orden del listado (backend: SHOP_SORTS). Por defecto, los más visitados
export type ShopSort = 'popular' | 'recent' | 'date' | 'price_asc' | 'price_desc' | 'name';

export const SHOP_SORTS: { value: ShopSort; label: string }[] = [
  { value: 'popular', label: 'Más visitados' },
  { value: 'date', label: 'Fecha más próxima' },
  { value: 'recent', label: 'Más nuevos' },
  { value: 'price_asc', label: 'Precio: de menor a mayor' },
  { value: 'price_desc', label: 'Precio: de mayor a menor' },
  { value: 'name', label: 'Nombre (A-Z)' },
];

export const DEFAULT_SORT: ShopSort = 'popular';

// Cómo se ven los resultados: rejilla de cards, lista o calendario de sesiones (?view=list)
export type ShopView = 'grid' | 'list' | 'calendar';

// Filtros, búsqueda, orden y página del shop. Se guardan en ShopStore y en la URL (?category=tardeo&page=2).
// La tienda la ve el cliente: categoría, organizador y lugar van por slug, no por _id
export interface ShopFilters {
  category: string | null; // slug de la categoría
  organizer: string | null; // slug del organizador
  venue: string | null; // slug del lugar
  minPrice: number | null; // precio "desde" del plan, en euros
  maxPrice: number | null;
  search: string;
  sort: ShopSort;
  page: number;
}

export const EMPTY_FILTERS: ShopFilters = {
  category: null, organizer: null, venue: null, minPrice: null, maxPrice: null, search: '', sort: DEFAULT_SORT, page: 1,
};

// GET /api/shop/plans → { ok, total, page, limit, totalPages, data }
export interface ShopPlansResponse extends ApiListResponse<ShopPlan> {
  page: number;
  limit: number;
  totalPages: number;
}

export interface ShopPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Sesión del calendario: con lo justo de su plan para pintarla y enlazar al detalle
export interface ShopCalendarSession {
  _id: string;
  planId: { _id: string; title: string; slug: string };
  startDateTime: string;
  endDateTime: string | null;
  price: number;
  currency: string;
  stock: number | null;
}

// GET /api/shop/sessions → { ok, month, total, data }
export interface ShopSessionsResponse extends ApiListResponse<ShopCalendarSession> {
  month: string; // AAAA-MM
}
