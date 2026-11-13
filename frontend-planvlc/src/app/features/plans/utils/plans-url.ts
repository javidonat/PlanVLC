import { ParamMap, Params } from '@angular/router';
import { EMPTY_PLAN_FILTERS, PLAN_SORTS, PlanListFilters, PlanSort, PlanView } from '../../../core/models/plan.model';
import { LIST_STATES, ListState, STATUSES, Status } from '../../../core/models/status.model';

// Sincronización filtros ⇄ URL del listado de planes del panel
// (/admin/planes?search=tardeo&status=published&state=active&category=<id>&sort=recent&page=2&view=cards)

const idFrom = (value: string | null): string | null => (value && /^[a-f\d]{24}$/i.test(value) ? value : null);

// URL → filtros. Lo que no es válido se ignora
export function planFiltersFromUrl(params: ParamMap): PlanListFilters {
  const page = Number(params.get('page'));
  const status = params.get('status') as Status;
  const state = params.get('state') as ListState;
  const sort = params.get('sort') as PlanSort;
  return {
    search: (params.get('search') ?? '').trim().slice(0, 100),
    status: STATUSES.some(s => s.value === status) ? status : null,
    state: LIST_STATES.some(s => s.value === state) ? state : null,
    category: idFrom(params.get('category')),
    organizer: idFrom(params.get('organizer')),
    venue: idFrom(params.get('venue')),
    sort: PLAN_SORTS.some(s => s.value === sort) ? sort : EMPTY_PLAN_FILTERS.sort,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

// Filtros + vista → query params. Solo los que tienen valor (la página 1, el orden y la vista por defecto no se escriben)
export function planFiltersToUrl(filters: PlanListFilters, view: PlanView): Params {
  const params: Params = {};
  if (filters.search) params['search'] = filters.search;
  if (filters.status) params['status'] = filters.status;
  if (filters.state) params['state'] = filters.state;
  if (filters.category) params['category'] = filters.category;
  if (filters.organizer) params['organizer'] = filters.organizer;
  if (filters.venue) params['venue'] = filters.venue;
  if (filters.sort !== EMPTY_PLAN_FILTERS.sort) params['sort'] = filters.sort;
  if (filters.page > 1) params['page'] = filters.page;
  if (view !== 'table') params['view'] = view;
  return params;
}

export function planViewFromUrl(params: ParamMap): PlanView {
  return params.get('view') === 'cards' ? 'cards' : 'table';
}
