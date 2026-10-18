import { CategoryRef, OrganizerRef, Plan, VenueRef } from '../../../core/models/plan.model';

// Funciones pequeñas para mostrar los datos de un plan en español.

// Las sesiones tienen fecha y hora reales: se muestran siempre en hora de Valencia
const TIME_ZONE = 'Europe/Madrid';

// Una relación puede llegar poblada ({ _id, ... }) o solo como id: devuelve siempre el id
export function refId(value: string | { _id: string } | null | undefined): string {
  if (!value) return '';
  return typeof value === 'string' ? value : value._id;
}

// Se queda solo con las relaciones que llegan pobladas
function populated<T extends { _id: string }>(value: string | T | null | undefined): T | null {
  return value && typeof value === 'object' ? value : null;
}

export function categoriesLabel(plan: Plan): string {
  const names = plan.categoryIds.map(c => populated(c)?.name).filter(Boolean);
  return names.length ? names.join(', ') : 'Sin categoría';
}

export function venueLabel(plan: Plan): string {
  const venue = populated(plan.venueId);
  if (!venue) return 'Lugar sin cargar';
  return venue.neighborhood && venue.neighborhood !== venue.name ? `${venue.name} · ${venue.neighborhood}` : venue.name;
}

export function priceText(price: number): string {
  if (price === 0) return 'Gratis';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    // 10 € (sin decimales) pero 12,50 € si tiene céntimos
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
  }).format(price);
}

// Precio del plan = el más barato de sus sesiones. Sin sesiones no hay precio que mostrar.
export function planPriceText(plan: Plan): string {
  if (!plan.nextSessionAt) return 'Sin sesiones';
  return plan.priceFrom === 0 ? 'Gratis' : `Desde ${priceText(plan.priceFrom)}`;
}

export function sessionDateText(iso: string | null): string {
  if (!iso) return 'Sin sesiones programadas';
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

// Opciones de los desplegables del formulario (GET /api/<colección>/active)
export interface PlanRefs {
  categories: CategoryRef[];
  venues: VenueRef[];
  organizers: OrganizerRef[];
}
