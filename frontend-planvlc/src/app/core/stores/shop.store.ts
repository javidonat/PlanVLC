import { Injectable, computed, signal } from '@angular/core';
import { EMPTY_FILTERS, ShopCategory, ShopFilters, ShopOrganizer, ShopPagination, ShopPlan, ShopVenue } from '../models/shop.model';

// Estado compartido de la tienda. Solo guarda datos: las páginas llaman al servicio
// y actualizan el store. Las señales privadas solo se modifican desde aquí.
@Injectable({ providedIn: 'root' })
export class ShopStore {
  // --- Catálogo: categorías, organizadores y lugares (carruseles del home y filtros del shop) ---
  private readonly _categories = signal<ShopCategory[]>([]);
  private readonly _organizers = signal<ShopOrganizer[]>([]);
  private readonly _venues = signal<ShopVenue[]>([]);
  private readonly _catalogLoading = signal(false);
  private readonly _catalogError = signal<string | null>(null);
  private readonly _catalogLoaded = signal(false);

  readonly categories = this._categories.asReadonly();
  readonly organizers = this._organizers.asReadonly();
  readonly venues = this._venues.asReadonly();
  readonly catalogLoading = this._catalogLoading.asReadonly();
  readonly catalogError = this._catalogError.asReadonly();
  readonly catalogLoaded = this._catalogLoaded.asReadonly();

  // --- Shop: filtros (sincronizados con la URL), planes, paginación, carga y errores ---
  private readonly _filters = signal<ShopFilters>({ ...EMPTY_FILTERS });
  private readonly _plans = signal<ShopPlan[]>([]);
  private readonly _pagination = signal<ShopPagination>({ total: 0, page: 1, limit: 6, totalPages: 0 });
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly filters = this._filters.asReadonly();
  readonly plans = this._plans.asReadonly();
  readonly pagination = this._pagination.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isEmpty = computed(() => !this._loading() && this._plans().length === 0);
  readonly hasActiveFilters = computed(() => {
    const { category, organizer, venue, minPrice, maxPrice, search } = this._filters();
    return !!(category || organizer || venue || search) || minPrice !== null || maxPrice !== null;
  });

  setCatalog(categories: ShopCategory[], organizers: ShopOrganizer[], venues: ShopVenue[]): void {
    this._categories.set(categories);
    this._organizers.set(organizers);
    this._venues.set(venues);
    this._catalogLoaded.set(true);
  }

  setCatalogLoading(value: boolean): void {
    this._catalogLoading.set(value);
  }

  setCatalogError(value: string | null): void {
    this._catalogError.set(value);
  }

  setFilters(filters: ShopFilters): void {
    this._filters.set(filters);
  }

  setPlans(plans: ShopPlan[], pagination: ShopPagination): void {
    this._plans.set(plans);
    this._pagination.set(pagination);
  }

  setLoading(value: boolean): void {
    this._loading.set(value);
  }

  setError(value: string | null): void {
    this._error.set(value);
  }
}
