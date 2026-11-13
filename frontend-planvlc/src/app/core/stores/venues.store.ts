import { Injectable, computed, signal } from '@angular/core';
import { Venue } from '../models/venue.model';
import { EMPTY_PAGINATION, Pagination } from '../models/api.model';
import { ListFilters, countListFilters } from '../models/list.model';

// Estado compartido de los lugares. Solo guarda datos: las páginas llaman al servicio
// y actualizan el store. Las señales privadas solo se modifican desde aquí.
@Injectable({ providedIn: 'root' })
export class VenuesStore {
  private readonly _items = signal<Venue[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _loaded = signal(false);
  private readonly _busyId = signal<string | null>(null); // lugar con una acción en curso

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly busyId = this._busyId.asReadonly();

  // --- Listado del panel: filtros (sincronizados con la URL) y paginación ---
  private readonly _filters = signal<ListFilters>({ search: '', state: null, sort: 'name', page: 1 });
  private readonly _pagination = signal<Pagination>({ ...EMPTY_PAGINATION });

  readonly filters = this._filters.asReadonly();
  readonly pagination = this._pagination.asReadonly();

  // Filtros aplicados (la búsqueda y el orden van aparte)
  readonly activeFilterCount = computed(() => countListFilters(this._filters()));
  readonly hasActiveFilters = computed(() => this.activeFilterCount() > 0 || !!this._filters().search);

  readonly count = computed(() => this._items().length);
  readonly isEmpty = computed(() => !this._loading() && this._items().length === 0);

  setLoading(value: boolean): void {
    this._loading.set(value);
  }

  setError(value: string | null): void {
    this._error.set(value);
  }

  setBusy(id: string | null): void {
    this._busyId.set(id);
  }

  setItems(items: Venue[]): void {
    this._items.set(items);
    this._loaded.set(true);
  }

  // Una página del listado del panel. La lista deja de contar como cargada (no están todos):
  // así el detalle o la edición piden la lista entera si entran a uno que no está en la página
  setPage(items: Venue[], pagination: Pagination): void {
    this._items.set(items);
    this._pagination.set(pagination);
    this._loaded.set(false);
  }

  setFilters(filters: ListFilters): void {
    this._filters.set(filters);
  }

  // Crea o sustituye un lugar en la lista
  upsert(item: Venue): void {
    this._items.update(current => {
      const index = current.findIndex(entry => entry._id === item._id);
      if (index === -1) return [item, ...current];
      const next = [...current];
      next[index] = item;
      return next;
    });
  }

  findById(id: string): Venue | undefined {
    return this._items().find(entry => entry._id === id);
  }
}
