import { Plan } from './plan.model';
import { ListState, Status } from './status.model';

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

// ---------- Listado del panel: filtros, orden, vista y página (van en la URL) ----------

// Orden del listado (backend: SESSION_SORTS). Por defecto, por fecha de inicio
export type SessionSort = 'date' | 'date_desc' | 'recent' | 'price_asc' | 'price_desc';

export const SESSION_SORTS: { value: SessionSort; label: string }[] = [
  { value: 'date', label: 'Fecha: más próximas' },
  { value: 'date_desc', label: 'Fecha: más lejanas' },
  { value: 'recent', label: 'Más nuevas' },
  { value: 'price_asc', label: 'Precio: de menor a mayor' },
  { value: 'price_desc', label: 'Precio: de mayor a menor' },
];

// Tabla o calendario del mes (?view=calendar&month=2027-10)
export type SessionView = 'table' | 'calendar';

export interface SessionListFilters {
  search: string; // contiene el texto en el SKU
  status: Status | null;
  state: ListState | null;
  plan: string | null; // _id del plan
  sort: SessionSort;
  page: number;
}

export const EMPTY_SESSION_FILTERS: SessionListFilters = {
  search: '', status: null, state: null, plan: null, sort: 'date', page: 1,
};
