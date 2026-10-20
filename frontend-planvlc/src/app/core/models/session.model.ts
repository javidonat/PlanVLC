import { Plan } from './plan.model';
import { Status } from './status.model';

// Una Session es una fecha concreta de un Plan, con su precio, aforo y stock
// (ej. cada domingo del "Tardeo Ruzafa", cada turno de motos de agua).
// Relación 1 plan → N sesiones. Una sesión NO puede existir sin su plan:
// planId es obligatorio en el backend (models/session.model.js).

// Datos del plan si el backend devuelve la sesión con populate de planId
export type PlanSessionRef = Pick<Plan, '_id' | 'title' | 'slug' | 'status' | 'isActive'>;

export interface Session {
  _id: string;
  planId: string | PlanSessionRef;
  sku: string; // código único de la variante, ej. 'TARDEO-RUZAFA-20251012-1700'
  startDateTime: string; // ISO
  endDateTime: string | null; // ISO, posterior al inicio
  price: number; // 0 = gratis
  currency: string; // 'EUR'
  capacity: number | null; // null = sin límite
  stock: number | null; // plazas libres; null = sin límite; nunca mayor que capacity
  status: Status;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Lo que acepta POST /api/sessions y PATCH /api/sessions/:id.
// sku, isActive y deletedAt los gestiona el servidor. En el PATCH no se envía planId (no se cambia de plan).
export interface SessionPayload {
  planId: string;
  startDateTime: string; // ISO
  endDateTime: string | null;
  price: number;
  capacity: number | null;
  stock: number | null;
  status: Status;
}
