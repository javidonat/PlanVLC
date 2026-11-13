import { ParamMap, Params } from '@angular/router';
import { EMPTY_SESSION_FILTERS, SESSION_SORTS, SessionListFilters, SessionSort, SessionView } from '../../../core/models/session.model';
import { LIST_STATES, ListState, STATUSES, Status } from '../../../core/models/status.model';

// Sincronización filtros ⇄ URL del listado de sesiones del panel
// (/admin/sesiones?search=TARDEO&plan=<id>&status=published&state=active&sort=date_desc&page=2)
// La vista calendario y su mes también van en la URL (?view=calendar&month=2027-10)

const idFrom = (value: string | null): string | null => (value && /^[a-f\d]{24}$/i.test(value) ? value : null);

// URL → filtros. Lo que no es válido se ignora
export function sessionFiltersFromUrl(params: ParamMap): SessionListFilters {
  const page = Number(params.get('page'));
  const status = params.get('status') as Status;
  const state = params.get('state') as ListState;
  const sort = params.get('sort') as SessionSort;
  return {
    search: (params.get('search') ?? '').trim().slice(0, 100),
    status: STATUSES.some(s => s.value === status) ? status : null,
    state: LIST_STATES.some(s => s.value === state) ? state : null,
    plan: idFrom(params.get('plan')),
    sort: SESSION_SORTS.some(s => s.value === sort) ? sort : EMPTY_SESSION_FILTERS.sort,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

// Filtros + vista (+ mes del calendario) → query params. Solo los que tienen valor
export function sessionFiltersToUrl(filters: SessionListFilters, view: SessionView, month: string | null): Params {
  const params: Params = {};
  if (filters.search) params['search'] = filters.search;
  if (filters.plan) params['plan'] = filters.plan;
  if (filters.status) params['status'] = filters.status;
  if (filters.state) params['state'] = filters.state;
  if (filters.sort !== EMPTY_SESSION_FILTERS.sort) params['sort'] = filters.sort;
  if (filters.page > 1) params['page'] = filters.page;
  if (view === 'calendar') {
    params['view'] = view;
    if (month) params['month'] = month;
  }
  return params;
}

export function sessionViewFromUrl(params: ParamMap): SessionView {
  return params.get('view') === 'calendar' ? 'calendar' : 'table';
}

// ?month=2027-10. Sin mes o no válido: el mes actual
export function sessionMonthFromUrl(params: ParamMap): string {
  const month = params.get('month');
  if (month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return month;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
