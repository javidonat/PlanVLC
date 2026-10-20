import { PlanSessionRef, Session } from '../../../core/models/session.model';

// Funciones pequeñas para mostrar los datos de una sesión en español.

// Las sesiones tienen fecha y hora reales: se muestran siempre en hora de Valencia
const TIME_ZONE = 'Europe/Madrid';

// planId puede llegar poblado ({ _id, title... }) o solo como id
export function sessionPlan(session: Session): PlanSessionRef | null {
  return session.planId && typeof session.planId === 'object' ? session.planId : null;
}

export function planTitle(session: Session): string {
  return sessionPlan(session)?.title ?? 'Plan sin cargar';
}

export function dateTimeText(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
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

// Aforo y stock: null = sin límite
export function limitText(value: number | null): string {
  return value === null ? 'Sin límite' : String(value);
}

// <input type="datetime-local"> trabaja con "2025-10-12T17:00" en la hora del navegador
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ...y el backend espera la fecha en ISO
export function fromLocalInput(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}
