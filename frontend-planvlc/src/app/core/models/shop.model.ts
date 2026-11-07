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

// Filtros, búsqueda y página del shop. Se guardan en ShopStore y en la URL (?category=tardeo&page=2).
// La tienda la ve el cliente: categoría, organizador y lugar van por slug, no por _id
export interface ShopFilters {
  category: string | null; // slug de la categoría
  organizer: string | null; // slug del organizador
  venue: string | null; // slug del lugar
  minPrice: number | null; // precio "desde" del plan, en euros
  maxPrice: number | null;
  search: string;
  page: number;
}

export const EMPTY_FILTERS: ShopFilters = {
  category: null, organizer: null, venue: null, minPrice: null, maxPrice: null, search: '', page: 1,
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
