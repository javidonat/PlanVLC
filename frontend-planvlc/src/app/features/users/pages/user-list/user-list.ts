import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { USER_STATUSES, User } from '../../../../core/models/user.model';
import { LIST_STATES } from '../../../../core/models/status.model';
import { ListFilters, ListSpec, emptyListFilters } from '../../../../core/models/list.model';
import { RolesService } from '../../../../core/services/roles.service';
import { AlertService } from '../../../../core/services/alert.service';
import { UsersService } from '../../../../core/services/users.service';
import { UsersStore } from '../../../../core/stores/users.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { ListToolbar, ToolbarFilter } from '../../../../shared/components/list-toolbar/list-toolbar';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { FilterOption } from '../../../../shared/components/select-filter/select-filter';
import { listFiltersFromUrl, listFiltersToUrl } from '../../../../shared/utils/list-url';
import { UserTable } from '../../components/user-table/user-table';

const SORT_OPTIONS = [
  { value: 'name', label: 'Nombre (A-Z)' },
  { value: 'name_desc', label: 'Nombre (Z-A)' },
  { value: 'recent', label: 'Más nuevos' },
  { value: 'last_login', label: 'Último acceso' },
];

// Filtros propios del listado (y sus valores válidos) y órdenes (backend: schemas/users.schema.js)
const SPEC: ListSpec = {
  filters: { status: USER_STATUSES.map(s => s.value), role: 'id' },
  sorts: SORT_OPTIONS.map(s => s.value),
  defaultSort: 'name',
};

// Listado del panel con búsqueda (nombre o email), filtros, orden y paginación.
// Como en el shop, la URL es la única fuente de verdad: la barra avisa, la página cambia la URL
// y cada cambio de la URL guarda los filtros en el store y pide la página.
@Component({
  selector: 'app-user-list',
  imports: [RouterLink, LucidePlus, SkeletonLoader, EmptyState, ErrorState, ListToolbar, Pagination, UserTable],
  templateUrl: './user-list.html',
})
export class UserList {
  readonly store = inject(UsersStore);
  private readonly service = inject(UsersService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly rolesService = inject(RolesService);

  // Petición en curso: si llega otra, se cancela (evita race conditions)
  private abortController: AbortController | null = null;

  readonly sortOptions = SORT_OPTIONS;
  readonly roleOptions = signal<FilterOption[]>([]);

  readonly toolbarFilters = computed<ToolbarFilter[]>(() => {
    const f = this.store.filters();
    return [
      { key: 'role', label: 'Rol', options: this.roleOptions(), value: f['role'] as string | null },
      { key: 'status', label: 'Estado', options: USER_STATUSES, value: f['status'] as string | null },
      { key: 'state', label: 'Disponibilidad', options: LIST_STATES, value: f.state },
    ];
  });

  // "5 usuarios · 2 filtros aplicados"
  readonly resultText = computed(() => {
    const total = this.store.pagination().total;
    const count = this.store.activeFilterCount();
    const filters = count ? ` · ${count} ${count === 1 ? 'filtro aplicado' : 'filtros aplicados'}` : '';
    return `${total} ${total === 1 ? 'usuario' : 'usuarios'}${filters}`;
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.store.setFilters(listFiltersFromUrl(params, SPEC));
      void this.load();
    });
    inject(DestroyRef).onDestroy(() => this.abortController?.abort());
    void this.loadRoles();
  }

  // Opciones del filtro de rol. Sin ellas el desplegable sale vacío, pero el listado funciona igual
  private async loadRoles(): Promise<void> {
    try {
      const res = await this.rolesService.getActive();
      this.roleOptions.set(res.data.map(role => ({ value: role._id, label: role.name })));
    } catch {
      // El interceptor ya muestra el error.
    }
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

  onView(user: User): void {
    void this.router.navigate(['/admin/usuarios', user._id]);
  }

  onEdit(user: User): void {
    void this.router.navigate(['/admin/usuarios', user._id, 'editar']);
  }

  async onToggle(user: User): Promise<void> {
    try {
      this.store.setBusy(user._id);
      const res = await this.service.setActive(user._id, !user.isActive);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error.
    } finally {
      this.store.setBusy(null);
    }
  }

  async onDelete(user: User): Promise<void> {
    const confirmed = await this.alerts.confirm('Eliminar usuario', `Se eliminará «${user.name}» y no se podrá recuperar desde el panel.`, 'Eliminar');
    if (!confirmed) return;
    try {
      this.store.setBusy(user._id);
      const res = await this.service.softDelete(user._id);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error (p. ej. 409).
    } finally {
      this.store.setBusy(null);
    }
  }
}
