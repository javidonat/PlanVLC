import { ShopPlan, ShopSession } from '../../../core/models/shop.model';
import { ORGANIZER_TYPES, OrganizerType } from '../../../core/models/organizer.model';
import { priceText, sessionDateText } from '../../plans/utils/plans.utils';

// Funciones pequeñas para mostrar los datos de la tienda en español

export { priceText };

// Fecha de la próxima sesión del plan (ej. "05 oct 2027, 17:00")
export function nextDateText(plan: ShopPlan): string {
  return sessionDateText(plan.nextSessionAt);
}

// Precio del plan = el más barato de sus próximas sesiones
export function planPriceText(plan: ShopPlan): string {
  if (!plan.nextSessionAt) return 'Sin fechas';
  return plan.priceFrom === 0 ? 'Gratis' : `Desde ${priceText(plan.priceFrom)}`;
}

export function venueText(venue: { name: string; neighborhood: string; city: string }): string {
  const place = venue.neighborhood && venue.neighborhood !== venue.name ? venue.neighborhood : venue.city;
  return place ? `${venue.name} · ${place}` : venue.name;
}

export function organizerTypeText(type: OrganizerType): string {
  return ORGANIZER_TYPES.find(t => t.value === type)?.label ?? type;
}

const dayKey = (iso: string) => new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'short' }).format(new Date(iso));
const timeText = (iso: string) => new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

// Fecha y hora de una sesión: "05 oct 2027, 17:00 – 23:00" (si acaba otro día, también su fecha)
export function sessionTimeText(session: ShopSession): string {
  const start = sessionDateText(session.startDateTime);
  if (!session.endDateTime) return start;
  const sameDay = dayKey(session.startDateTime) === dayKey(session.endDateTime);
  return `${start} – ${sameDay ? timeText(session.endDateTime) : sessionDateText(session.endDateTime)}`;
}

// Plazas libres: null = sin límite; 0 = agotada
export function stockText(session: ShopSession): string {
  if (session.stock === null) return 'Plazas sin límite';
  if (session.stock === 0) return 'Agotada';
  return session.capacity === null ? `${session.stock} plazas libres` : `${session.stock} de ${session.capacity} plazas libres`;
}

export function isSoldOut(session: ShopSession): boolean {
  return session.stock === 0;
}

// Primera letra para las cards sin imagen
export function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}
