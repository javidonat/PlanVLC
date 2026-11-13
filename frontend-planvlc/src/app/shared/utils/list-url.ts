import { ParamMap, Params } from '@angular/router';
import { ListFilters, ListSpec, emptyListFilters } from '../../core/models/list.model';
import { LIST_STATES, ListState } from '../../core/models/status.model';

// Sincronización filtros ⇄ URL de los listados del panel (lugares, organizadores y categorías)

// URL → filtros. Lo que no es válido (valores que no existen, página no numérica) se ignora
export function listFiltersFromUrl(params: ParamMap, spec: ListSpec): ListFilters {
  const filters = emptyListFilters(spec);
  const page = Number(params.get('page'));
  const state = params.get('state') as ListState;
  const sort = params.get('sort') ?? '';
  filters.search = (params.get('search') ?? '').trim().slice(0, 100);
  filters.state = LIST_STATES.some(s => s.value === state) ? state : null;
  filters.sort = spec.sorts.includes(sort) ? sort : spec.defaultSort;
  filters.page = Number.isInteger(page) && page > 1 ? page : 1;
  for (const [key, values] of Object.entries(spec.filters)) {
    const value = params.get(key) ?? '';
    const valid = values === 'id' ? /^[a-f\d]{24}$/i.test(value) : values.includes(value);
    filters[key] = valid ? value : null;
  }
  return filters;
}

// Filtros → query params. Solo los que tienen valor (la página 1 y el orden por defecto no se escriben)
export function listFiltersToUrl(filters: ListFilters, spec: ListSpec): Params {
  const params: Params = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === '') continue;
    if (key === 'page' && value === 1) continue;
    if (key === 'sort' && value === spec.defaultSort) continue;
    params[key] = value;
  }
  return params;
}
