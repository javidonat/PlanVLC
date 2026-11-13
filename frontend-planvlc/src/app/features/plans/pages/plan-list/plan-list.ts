import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { EMPTY_PLAN_FILTERS, PLAN_SORTS, Plan, PlanListFilters, PlanSort, PlanView } from '../../../../core/models/plan.model';
import { LIST_STATES, STATUSES } from '../../../../core/models/status.model';
import { AlertService } from '../../../../core/services/alert.service';
import { PlansService } from '../../../../core/services/plans.service';
import { CategoriesService } from '../../../../core/services/categories.service';
import { OrganizersService } from '../../../../core/services/organizers.service';
import { VenuesService } from '../../../../core/services/venues.service';
import { PlansStore } from '../../../../core/stores/plans.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SearchBar } from '../../../../shared/components/search-bar/search-bar';
import { SortSelect } from '../../../../shared/components/sort-select/sort-select';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { DropdownFilter } from '../../../../shared/components/dropdown-filter/dropdown-filter';
import { FilterOption } from '../../../../shared/components/select-filter/select-filter';
import { ViewOption, ViewSwitcher } from '../../../../shared/components/view-switcher/view-switcher';
import { PlanTable } from '../../components/plan-table/plan-table';
import { AdminPlanCard } from '../../components/plan-card/plan-card';
import { planFiltersFromUrl, planFiltersToUrl, planViewFromUrl } from '../../utils/plans-url';

type FilterKey = 'status' | 'state' | 'category' | 'organizer' | 'venue';

// Listado de planes del panel con búsqueda, filtros, orden, vista (tabla o tarjetas) y paginación.
// Como en el shop, la URL es la única fuente de verdad: los componentes avisan, la página cambia la URL
// y cada cambio de la URL guarda los filtros en el store y pide la página de planes.
@Component({
  selector: 'app-plan-list',
  imports: [RouterLink, LucidePlus, SkeletonLoader, EmptyState, ErrorState, SearchBar, SortSelect, Pagination, DropdownFilter, ViewSwitcher, PlanTable, AdminPlanCard],
  templateUrl: './plan-list.html',
})
export class PlanList implements OnInit {
  readonly store = inject(PlansStore);
  private readonly service = inject(PlansService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly organizersService = inject(OrganizersService);
  private readonly venuesService = inject(VenuesService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Petición en curso: si llega otra, se cancela (evita race conditions)
  private abortController: AbortController | null = null;

  // Opciones de los filtros de categoría, organizador y lugar
  readonly categoryOptions = signal<FilterOption[]>([]);
  readonly organizerOptions = signal<FilterOption[]>([]);
  readonly venueOptions = signal<FilterOption[]>([]);

  readonly statusOptions: FilterOption[] = STATUSES;
  readonly stateOptions: FilterOption[] = LIST_STATES;
  readonly sortOptions = PLAN_SORTS;
  readonly viewOptions: ViewOption[] = [
    { value: 'table', label: 'Tabla', icon: 'table' },
    { value: 'cards', label: 'Tarjetas', icon: 'grid' },
  ];

  // "5 planes · 2 filtros aplicados"
  readonly resultText = computed(() => {
    const total = this.store.pagination().total;
    const count = this.store.activeFilterCount();
    const filters = count ? ` · ${count} ${count === 1 ? 'filtro aplicado' : 'filtros aplicados'}` : '';
    return `${total} ${total === 1 ? 'plan' : 'planes'}${filters}`;
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.store.setFilters(planFiltersFromUrl(params));
      this.store.setView(planViewFromUrl(params));
      void this.load();
    });
    inject(DestroyRef).onDestroy(() => this.abortController?.abort());
  }

  ngOnInit(): void {
    void this.loadOptions();
  }

  async load(): Promise<void> {
    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;
    try {
      this.store.setLoading(true);
      this.store.setError(null);
      const res = await this.service.getList(this.store.filters(), controller.signal);
      this.store.setPage(res.data, { total: res.total, page: res.page, limit: res.limit, totalPages: res.totalPages });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return; // la sustituye otra más nueva
      this.store.setError(apiError(error).message);
    } finally {
      if (this.abortController === controller) this.store.setLoading(false);
    }
  }

  // Sin opciones los desplegables salen vacíos, pero el listado funciona igual
  private async loadOptions(): Promise<void> {
    try {
      const [categories, organizers, venues] = await Promise.all([
        this.categoriesService.getActive(),
        this.organizersService.getActive(),
        this.venuesService.getActive(),
      ]);
      this.categoryOptions.set(categories.data.map(c => ({ value: c._id, label: c.name })));
      this.organizerOptions.set(organizers.data.map(o => ({ value: o._id, label: o.name })));
      this.venueOptions.set(venues.data.map(v => ({ value: v._id, label: v.name })));
    } catch {
      // El interceptor ya muestra el error.
    }
  }

  // Al buscar o filtrar se vuelve a la página 1
  onSearch(search: string): void {
    this.updateUrl({ search, page: 1 }, true); // replaceUrl: no llena el historial con cada búsqueda
  }

  onFilter(key: FilterKey, value: string | null): void {
    this.updateUrl({ [key]: value, page: 1 } as Partial<PlanListFilters>);
  }

  onSort(sort: string): void {
    this.updateUrl({ sort: sort as PlanSort, page: 1 });
  }

  // Quita búsqueda y filtros; el orden y la vista se quedan
  onClear(): void {
    this.updateUrl({ ...EMPTY_PLAN_FILTERS, sort: this.store.filters().sort });
  }

  onViewChange(view: string): void {
    this.updateUrl({}, false, view as PlanView);
  }

  onPage(page: number): void {
    this.updateUrl({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onView(plan: Plan): void {
    void this.router.navigate(['/admin/planes', plan._id]);
  }

  onEdit(plan: Plan): void {
    void this.router.navigate(['/admin/planes', plan._id, 'editar']);
  }

  async onToggle(plan: Plan): Promise<void> {
    try {
      this.store.setBusy(plan._id);
      const res = await this.service.setActive(plan._id, !plan.isActive);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error.
    } finally {
      this.store.setBusy(null);
    }
  }

  async onDelete(plan: Plan): Promise<void> {
    const confirmed = await this.alerts.confirm('Eliminar plan', `Se eliminará «${plan.title}» y no se podrá recuperar desde el panel.`, 'Eliminar');
    if (!confirmed) return;
    try {
      this.store.setBusy(plan._id);
      const res = await this.service.softDelete(plan._id);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error (p. ej. 409 si tiene sesiones).
    } finally {
      this.store.setBusy(null);
    }
  }

  // Filtros + vista → URL. El resto lo hace la suscripción a la URL
  private updateUrl(changes: Partial<PlanListFilters>, replaceUrl = false, view = this.store.view()): void {
    const queryParams = planFiltersToUrl({ ...this.store.filters(), ...changes }, view);
    void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl });
  }
}
