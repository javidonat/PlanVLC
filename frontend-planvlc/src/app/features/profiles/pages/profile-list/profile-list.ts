import { Component, DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { LIST_STATES } from '../../../../core/models/status.model';
import { ListFilters, ListSpec, emptyListFilters } from '../../../../core/models/list.model';
import { AdminProfile } from '../../../../core/models/profile.model';
import { ProfilesService } from '../../../../core/services/profiles.service';
import { ProfilesStore } from '../../../../core/stores/profiles.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { ListToolbar, ToolbarFilter } from '../../../../shared/components/list-toolbar/list-toolbar';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { listFiltersFromUrl, listFiltersToUrl } from '../../../../shared/utils/list-url';
import { ProfileTable } from '../../components/profile-table/profile-table';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Más nuevos' },
  { value: 'oldest', label: 'Más antiguos' },
];

// Órdenes del listado (backend: schemas/profiles.schema.js). Sin filtros propios: solo la disponibilidad
const SPEC: ListSpec = { filters: {}, sorts: SORT_OPTIONS.map(s => s.value), defaultSort: 'recent' };

// Listado del panel con búsqueda (usuario, nombre, apellidos o teléfono), disponibilidad, orden y paginación.
// La URL es la única fuente de verdad: cada cambio de la URL guarda los filtros en el store y pide la página.
// Se recarga siempre al entrar: el estado del perfil cambia al activar, desactivar o eliminar su usuario
@Component({
  selector: 'app-profile-list',
  imports: [SkeletonLoader, EmptyState, ErrorState, ListToolbar, Pagination, ProfileTable],
  templateUrl: './profile-list.html',
})
export class ProfileList {
  readonly store = inject(ProfilesStore);
  private readonly service = inject(ProfilesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Petición en curso: si llega otra, se cancela (evita race conditions)
  private abortController: AbortController | null = null;

  readonly sortOptions = SORT_OPTIONS;

  readonly toolbarFilters = computed<ToolbarFilter[]>(() => [
    { key: 'state', label: 'Disponibilidad', options: LIST_STATES, value: this.store.filters().state },
  ]);

  // "5 perfiles · 1 filtro aplicado"
  readonly resultText = computed(() => {
    const total = this.store.pagination().total;
    const count = this.store.activeFilterCount();
    const filters = count ? ` · ${count} ${count === 1 ? 'filtro aplicado' : 'filtros aplicados'}` : '';
    return `${total} ${total === 1 ? 'perfil' : 'perfiles'}${filters}`;
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.store.setFilters(listFiltersFromUrl(params, SPEC));
      void this.load();
    });
    inject(DestroyRef).onDestroy(() => this.abortController?.abort());
  }

  async load(): Promise<void> {
    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;
    try {
      this.store.setLoading(true);
      this.store.setError(null);
      const res = await this.service.getList(this.store.filters(), SPEC, controller.signal);
      this.store.setPage(res.data, { total: res.total, page: res.page, limit: res.limit, totalPages: res.totalPages });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return; // la sustituye otra más nueva
      this.store.setError(apiError(error).message);
    } finally {
      if (this.abortController === controller) this.store.setLoading(false);
    }
  }

  // Al buscar o filtrar se vuelve a la página 1
  onSearch(search: string): void {
    this.updateUrl({ search, page: 1 }, true); // replaceUrl: no llena el historial con cada búsqueda
  }

  onFilter({ key, value }: { key: string; value: string | null }): void {
    this.updateUrl({ [key]: value, page: 1 });
  }

  onSort(sort: string): void {
    this.updateUrl({ sort, page: 1 });
  }

  // Quita búsqueda y filtros; el orden se queda
  onClear(): void {
    this.updateUrl({ ...emptyListFilters(SPEC), sort: this.store.filters().sort });
  }

  onPage(page: number): void {
    this.updateUrl({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Filtros → URL. El resto lo hace la suscripción a la URL
  private updateUrl(changes: Partial<ListFilters>, replaceUrl = false): void {
    const queryParams = listFiltersToUrl({ ...this.store.filters(), ...changes } as ListFilters, SPEC);
    void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl });
  }

  onEdit(profile: AdminProfile): void {
    if (!profile.userId) return;
    void this.router.navigate(['/admin/perfiles', profile.userId._id, 'editar']);
  }
}
