import { ParamMap, Params } from '@angular/router';
import { EMPTY_FILTERS, SHOP_SORTS, ShopFilters, ShopSort, ShopView } from '../../../core/models/shop.model';

// Sincronización filtros ⇄ URL del shop
// (/planes?category=tardeo,concierto&organizer=...&venue=...&minPrice=10&maxPrice=30&search=...&sort=date&page=2)
// La vista y el mes del calendario también van en la URL (?view=calendar&month=2027-10)

const slugFrom = (value: string | null): string | null => {
  const slug = value?.trim().toLowerCase() ?? '';
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 200 ? slug : null;
};

// ?category=tardeo,concierto → ['tardeo', 'concierto'] (sin repetidos ni slugs mal escritos)
const slugsFrom = (value: string | null): string[] => {
  const slugs = (value ?? '').split(',').map(slugFrom).filter((slug): slug is string => slug !== null);
  return [...new Set(slugs)].slice(0, 20);
};

const priceFrom = (value: string | null): number | null => {
  if (value === null || value.trim() === '') return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
};

// URL → filtros. Lo que no es válido (slugs mal escritos, precios o página no numéricos) se ignora
export function filtersFromUrl(params: ParamMap): ShopFilters {
  const page = Number(params.get('page'));
  const minPrice = priceFrom(params.get('minPrice'));
  const maxPrice = priceFrom(params.get('maxPrice'));
  const validRange = minPrice === null || maxPrice === null || minPrice <= maxPrice;
  return {
    category: slugsFrom(params.get('category')),
    organizer: slugsFrom(params.get('organizer')),
    venue: slugsFrom(params.get('venue')),
    minPrice,
    maxPrice: validRange ? maxPrice : null, // un máximo menor que el mínimo se ignora
    search: (params.get('search') ?? '').trim().slice(0, 100),
    sort: SHOP_SORTS.some(s => s.value === params.get('sort')) ? (params.get('sort') as ShopSort) : EMPTY_FILTERS.sort,
    page: Number.isInteger(page) && page > 1 ? page : EMPTY_FILTERS.page,
  };
}

// Filtros → query params. Solo los que tienen valor (la página 1 no se escribe)
export function filtersToUrl(filters: ShopFilters): Params {
  const params: Params = {};
  if (filters.category.length) params['category'] = filters.category.join(',');
  if (filters.organizer.length) params['organizer'] = filters.organizer.join(',');
  if (filters.venue.length) params['venue'] = filters.venue.join(',');
  if (filters.minPrice !== null) params['minPrice'] = filters.minPrice;
  if (filters.maxPrice !== null) params['maxPrice'] = filters.maxPrice;
  if (filters.search) params['search'] = filters.search;
  if (filters.sort !== EMPTY_FILTERS.sort) params['sort'] = filters.sort;
  if (filters.page > 1) params['page'] = filters.page;
  return params;
}

const VIEWS: ShopView[] = ['grid', 'list', 'calendar'];

// ?view=list → 'list'. Sin vista o no válida: rejilla
export function viewFromUrl(params: ParamMap): ShopView {
  const view = params.get('view') as ShopView;
  return VIEWS.includes(view) ? view : 'grid';
}

// ?month=2027-10 → '2027-10'. Sin mes o no válido: null (el backend elige)
export function monthFromUrl(params: ParamMap): string | null {
  const month = params.get('month');
  return month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : null;
}
