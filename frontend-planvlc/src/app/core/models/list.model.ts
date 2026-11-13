import { ListState } from './status.model';

// Listados del panel de lugares, organizadores y categorías: búsqueda, disponibilidad,
// filtros propios de cada uno (estado, tipo, grupo...), orden y página. Van en la URL
// (?search=sala&status=open&state=active&sort=recent&page=2)
export interface ListFilters {
  search: string;
  state: ListState | null;
  sort: string;
  page: number;
  [filter: string]: string | number | null; // filtros propios: status, type, group...
}

// Qué filtros propios tiene cada listado (y sus valores válidos) y sus órdenes
export interface ListSpec {
  filters: Record<string, string[]>; // ej. { status: ['open', ...] }
  sorts: string[];
  defaultSort: string;
}

// Opciones de orden de los listados por nombre (lugares, organizadores y categorías)
export const NAME_SORTS = [
  { value: 'name', label: 'Nombre (A-Z)' },
  { value: 'name_desc', label: 'Nombre (Z-A)' },
  { value: 'recent', label: 'Más nuevos' },
];

export function emptyListFilters(spec: ListSpec): ListFilters {
  const filters: ListFilters = { search: '', state: null, sort: spec.defaultSort, page: 1 };
  for (const key of Object.keys(spec.filters)) filters[key] = null;
  return filters;
}

// Filtros aplicados (la búsqueda y el orden van aparte)
export function countListFilters(filters: ListFilters): number {
  const { search, sort, page, ...rest } = filters;
  return Object.values(rest).filter(value => value !== null).length;
}

// Filtros → query params del backend (los vacíos no se envían; el orden por defecto tampoco)
export function listQueryParams(filters: ListFilters, spec: ListSpec): Record<string, string | number | null> {
  const { search, sort, ...rest } = filters;
  return { ...rest, search: search.trim(), sort: sort !== spec.defaultSort ? sort : null };
}
