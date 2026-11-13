import { Component, DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { ORGANIZER_STATUSES, ORGANIZER_TYPES, Organizer } from '../../../../core/models/organizer.model';
import { LIST_STATES } from '../../../../core/models/status.model';
import { ListFilters, ListSpec, NAME_SORTS, emptyListFilters } from '../../../../core/models/list.model';
import { AlertService } from '../../../../core/services/alert.service';
import { OrganizersService } from '../../../../core/services/organizers.service';
import { OrganizersStore } from '../../../../core/stores/organizers.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { ListToolbar, ToolbarFilter } from '../../../../shared/components/list-toolbar/list-toolbar';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { listFiltersFromUrl, listFiltersToUrl } from '../../../../shared/utils/list-url';
import { OrganizerTable } from '../../components/organizer-table/organizer-table';

// Filtros propios del listado (y sus valores válidos) y órdenes (backend: schemas/organizers.schema.js)
const SPEC: ListSpec = {
  filters: { status: ORGANIZER_STATUSES.map(o => o.value), type: ORGANIZER_TYPES.map(o => o.value) },
  sorts: [...NAME_SORTS].map(s => s.value),
  defaultSort: 'name',
};

// Listado del panel con búsqueda, filtros, orden y paginación.
// Como en el shop, la URL es la única fuente de verdad: la barra avisa, la página cambia la URL
// y cada cambio de la URL guarda los filtros en el store y pide la página.
@Component({
  selector: 'app-organizer-list',
  imports: [RouterLink, LucidePlus, SkeletonLoader, EmptyState, ErrorState, ListToolbar, Pagination, OrganizerTable],
  templateUrl: './organizer-list.html',
})
export class OrganizerList {
  readonly store = inject(OrganizersStore);
  private readonly service = inject(OrganizersService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Petición en curso: si llega otra, se cancela (evita race conditions)
  private abortController: AbortController | null = null;

  readonly sortOptions = [...NAME_SORTS];

  // Desplegables de la barra: los propios del listado y la disponibilidad
  readonly toolbarFilters = computed<ToolbarFilter[]>(() => {
    const f = this.store.filters();
    return [
    { key: 'status', label: 'Estado', allLabel: 'Todos', options: ORGANIZER_STATUSES, value: f['status'] as string | null },
    { key: 'type', label: 'Tipo', allLabel: 'Todos', options: ORGANIZER_TYPES, value: f['type'] as string | null },
      { key: 'state', label: 'Disponibilidad', allLabel: 'Todos', options: LIST_STATES.map(s => ({ value: s.value, label: s.label })), value: f.state },
    ];
  });

  // "5 organizadores · 2 filtros aplicados"
  readonly resultText = computed(() => {
    const total = this.store.pagination().total;
    const count = this.store.activeFilterCount();
    const filters = count ? ` · ${count} ${count === 1 ? 'filtro aplicado' : 'filtros aplicados'}` : '';
    return `${total} ${total === 1 ? 'organizador' : 'organizadores'}${filters}`;
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

  onView(organizer: Organizer): void {
    void this.router.navigate(['/admin/organizadores', organizer._id]);
  }

  onEdit(organizer: Organizer): void {
    void this.router.navigate(['/admin/organizadores', organizer._id, 'editar']);
  }

  async onToggle(organizer: Organizer): Promise<void> {
    try {
      this.store.setBusy(organizer._id);
      const res = await this.service.setActive(organizer._id, !organizer.isActive);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error.
    } finally {
      this.store.setBusy(null);
    }
  }

  async onDelete(organizer: Organizer): Promise<void> {
    const confirmed = await this.alerts.confirm('Eliminar organizador', `Se eliminará «${organizer.name}» y no se podrá recuperar desde el panel.`, 'Eliminar');
    if (!confirmed) return;
    try {
      this.store.setBusy(organizer._id);
      const res = await this.service.softDelete(organizer._id);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error (p. ej. 409 si tiene planes).
    } finally {
      this.store.setBusy(null);
    }
  }
}
