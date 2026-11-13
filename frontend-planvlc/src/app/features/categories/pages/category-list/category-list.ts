import { Component, DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { CATEGORY_GROUPS, CATEGORY_STATUSES, Category } from '../../../../core/models/category.model';
import { LIST_STATES } from '../../../../core/models/status.model';
import { ListFilters, ListSpec, NAME_SORTS, emptyListFilters } from '../../../../core/models/list.model';
import { AlertService } from '../../../../core/services/alert.service';
import { CategoriesService } from '../../../../core/services/categories.service';
import { CategoriesStore } from '../../../../core/stores/categories.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { ListToolbar, ToolbarFilter } from '../../../../shared/components/list-toolbar/list-toolbar';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { listFiltersFromUrl, listFiltersToUrl } from '../../../../shared/utils/list-url';
import { CategoryTable } from '../../components/category-table/category-table';

// Filtros propios del listado (y sus valores válidos) y órdenes (backend: schemas/categories.schema.js)
const SPEC: ListSpec = {
  filters: { status: CATEGORY_STATUSES.map(o => o.value), group: CATEGORY_GROUPS.map(o => o.value) },
  sorts: [...NAME_SORTS].map(s => s.value),
  defaultSort: 'name',
};

// Listado del panel con búsqueda, filtros, orden y paginación.
// Como en el shop, la URL es la única fuente de verdad: la barra avisa, la página cambia la URL
// y cada cambio de la URL guarda los filtros en el store y pide la página.
@Component({
  selector: 'app-category-list',
  imports: [RouterLink, LucidePlus, SkeletonLoader, EmptyState, ErrorState, ListToolbar, Pagination, CategoryTable],
  templateUrl: './category-list.html',
})
export class CategoryList {
  readonly store = inject(CategoriesStore);
  private readonly service = inject(CategoriesService);
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
    { key: 'status', label: 'Estado', allLabel: 'Todas', options: CATEGORY_STATUSES, value: f['status'] as string | null },
    { key: 'group', label: 'Grupo', allLabel: 'Todas', options: CATEGORY_GROUPS, value: f['group'] as string | null },
      { key: 'state', label: 'Disponibilidad', allLabel: 'Todas', options: LIST_STATES.map(s => ({ value: s.value, label: s.label.replace(/os$/, 'as') })), value: f.state },
    ];
  });

  // "5 categorías · 2 filtros aplicados"
  readonly resultText = computed(() => {
    const total = this.store.pagination().total;
    const count = this.store.activeFilterCount();
    const filters = count ? ` · ${count} ${count === 1 ? 'filtro aplicado' : 'filtros aplicados'}` : '';
    return `${total} ${total === 1 ? 'categoría' : 'categorías'}${filters}`;
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

  onView(category: Category): void {
    void this.router.navigate(['/admin/categorias', category._id]);
  }

  onEdit(category: Category): void {
    void this.router.navigate(['/admin/categorias', category._id, 'editar']);
  }

  async onToggle(category: Category): Promise<void> {
    try {
      this.store.setBusy(category._id);
      const res = await this.service.setActive(category._id, !category.isActive);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error.
    } finally {
      this.store.setBusy(null);
    }
  }

  async onDelete(category: Category): Promise<void> {
    const confirmed = await this.alerts.confirm('Eliminar categoría', `Se eliminará «${category.name}» y no se podrá recuperar desde el panel.`, 'Eliminar');
    if (!confirmed) return;
    try {
      this.store.setBusy(category._id);
      const res = await this.service.softDelete(category._id);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error (p. ej. 409 si la usan planes).
    } finally {
      this.store.setBusy(null);
    }
  }
}
