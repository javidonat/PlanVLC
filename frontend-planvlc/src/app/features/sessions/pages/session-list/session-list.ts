import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { EMPTY_SESSION_FILTERS, PlanSessionRef, SESSION_SORTS, Session, SessionListFilters, SessionSort, SessionView } from '../../../../core/models/session.model';
import { ShopCalendarSession } from '../../../../core/models/shop.model';
import { LIST_STATES, STATUSES } from '../../../../core/models/status.model';
import { AlertService } from '../../../../core/services/alert.service';
import { PlansService } from '../../../../core/services/plans.service';
import { SessionsService } from '../../../../core/services/sessions.service';
import { PlansStore } from '../../../../core/stores/plans.store';
import { SessionsStore } from '../../../../core/stores/sessions.store';
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
import { PlanCalendar } from '../../../shop/components/plan-calendar/plan-calendar';
import { monthLabel } from '../../../shop/utils/calendar.utils';
import { SessionTable } from '../../components/session-table/session-table';
import { sessionFiltersFromUrl, sessionFiltersToUrl, sessionMonthFromUrl, sessionViewFromUrl } from '../../utils/sessions-url';

type FilterKey = 'plan' | 'status' | 'state';

// Listado de sesiones del panel con búsqueda (SKU), filtros, orden, vista (tabla o calendario) y paginación.
// Como en el shop, la URL es la única fuente de verdad: los componentes avisan, la página cambia la URL
// y cada cambio de la URL guarda los filtros en el store y pide los datos de esa vista.
@Component({
  selector: 'app-session-list',
  imports: [RouterLink, LucidePlus, SkeletonLoader, EmptyState, ErrorState, SearchBar, SortSelect, Pagination, DropdownFilter, ViewSwitcher, PlanCalendar, SessionTable],
  templateUrl: './session-list.html',
})
export class SessionList implements OnInit {
  readonly store = inject(SessionsStore);
  private readonly service = inject(SessionsService);
  private readonly plansStore = inject(PlansStore);
  private readonly plansService = inject(PlansService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Petición en curso: si llega otra, se cancela (evita race conditions)
  private abortController: AbortController | null = null;

  readonly planOptions = signal<FilterOption[]>([]);
  readonly statusOptions: FilterOption[] = STATUSES;
  readonly stateOptions: FilterOption[] = LIST_STATES.map(s => ({ value: s.value, label: s.label.replace(/os$/, 'as') })); // activas, inactivas...
  readonly sortOptions = SESSION_SORTS;
  readonly viewOptions: ViewOption[] = [
    { value: 'table', label: 'Tabla', icon: 'table' },
    { value: 'calendar', label: 'Calendario', icon: 'calendar' },
  ];

  // Sesiones con su plan para el calendario (el mismo que el del shop)
  readonly calendarSessions = computed<ShopCalendarSession[]>(() =>
    this.store.items()
      .filter(session => typeof session.planId === 'object')
      .map(session => ({ ...session, planId: session.planId as PlanSessionRef })),
  );

  // "12 sesiones · 1 filtro aplicado" o "5 sesiones en octubre de 2027"
  readonly resultText = computed(() => {
    const count = this.store.activeFilterCount();
    const filters = count ? ` · ${count} ${count === 1 ? 'filtro aplicado' : 'filtros aplicados'}` : '';
    const month = this.store.calendarMonth();
    if (this.store.view() === 'calendar') {
      const total = this.store.items().length;
      return `${total} ${total === 1 ? 'sesión' : 'sesiones'}${month ? ` en ${monthLabel(month)}` : ''}${filters}`;
    }
    const total = this.store.pagination().total;
    return `${total} ${total === 1 ? 'sesión' : 'sesiones'}${filters}`;
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.store.setFilters(sessionFiltersFromUrl(params));
      this.store.setView(sessionViewFromUrl(params));
      this.store.setCalendarMonth(sessionMonthFromUrl(params));
      void this.load();
    });
    inject(DestroyRef).onDestroy(() => this.abortController?.abort());
  }

  ngOnInit(): void {
    void this.loadPlanOptions();
  }

  // Página de sesiones (tabla) o sesiones del mes (calendario). Una petición nueva cancela la anterior
  async load(): Promise<void> {
    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;
    try {
      this.store.setLoading(true);
      this.store.setError(null);
      const month = this.store.calendarMonth();
      if (this.store.view() === 'calendar' && month) {
        const res = await this.service.getMonth(this.store.filters(), month, controller.signal);
        this.store.setPage(res.data, { total: res.total, page: 1, limit: res.total, totalPages: 1 });
      } else {
        const res = await this.service.getList(this.store.filters(), controller.signal);
        this.store.setPage(res.data, { total: res.total, page: res.page, limit: res.limit, totalPages: res.totalPages });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return; // la sustituye otra más nueva
      this.store.setError(apiError(error).message);
    } finally {
      if (this.abortController === controller) this.store.setLoading(false);
    }
  }

  // Planes del filtro (también los desactivados y eliminados: pueden tener sesiones)
  private async loadPlanOptions(): Promise<void> {
    try {
      const res = await this.plansService.getAll();
      this.planOptions.set(res.data.map(plan => ({ value: plan._id, label: plan.title })));
    } catch {
      // El interceptor ya muestra el error.
    }
  }

  // Al buscar o filtrar se vuelve a la página 1
  onSearch(search: string): void {
    this.updateUrl({ search, page: 1 }, true); // replaceUrl: no llena el historial con cada búsqueda
  }

  onFilter(key: FilterKey, value: string | null): void {
    this.updateUrl({ [key]: value, page: 1 } as Partial<SessionListFilters>);
  }

  onSort(sort: string): void {
    this.updateUrl({ sort: sort as SessionSort, page: 1 });
  }

  // Quita búsqueda y filtros; el orden y la vista se quedan
  onClear(): void {
    this.updateUrl({ ...EMPTY_SESSION_FILTERS, sort: this.store.filters().sort });
  }

  onViewChange(view: string): void {
    this.updateUrl({ page: 1 }, false, view as SessionView);
  }

  onMonth(month: string): void {
    this.updateUrl({}, false, 'calendar', month);
  }

  onPage(page: number): void {
    this.updateUrl({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onCalendarSession(session: ShopCalendarSession): void {
    void this.router.navigate(['/admin/sesiones', session._id]);
  }

  onView(session: Session): void {
    void this.router.navigate(['/admin/sesiones', session._id]);
  }

  onEdit(session: Session): void {
    void this.router.navigate(['/admin/sesiones', session._id, 'editar']);
  }

  async onToggle(session: Session): Promise<void> {
    try {
      this.store.setBusy(session._id);
      const res = await this.service.setActive(session._id, !session.isActive);
      this.store.upsert(res.data);
      await this.refreshPlans();
    } catch {
      // El interceptor ya muestra el error.
    } finally {
      this.store.setBusy(null);
    }
  }

  async onDelete(session: Session): Promise<void> {
    const confirmed = await this.alerts.confirm('Eliminar sesión', `Se eliminará la sesión ${session.sku} y no se podrá recuperar desde el panel.`, 'Eliminar');
    if (!confirmed) return;
    try {
      this.store.setBusy(session._id);
      const res = await this.service.softDelete(session._id);
      this.store.upsert(res.data);
      await this.refreshPlans();
    } catch {
      // El interceptor ya muestra el error.
    } finally {
      this.store.setBusy(null);
    }
  }

  // El backend recalcula el precio y la próxima fecha del plan: si el listado de planes
  // ya estaba cargado, se vuelve a pedir para que no muestre datos viejos
  private async refreshPlans(): Promise<void> {
    if (!this.plansStore.loaded()) return;
    const res = await this.plansService.getAll();
    this.plansStore.setItems(res.data);
  }

  // Filtros + vista (+ mes del calendario) → URL. El resto lo hace la suscripción a la URL
  private updateUrl(changes: Partial<SessionListFilters>, replaceUrl = false, view = this.store.view(), month = this.store.calendarMonth()): void {
    const queryParams = sessionFiltersToUrl({ ...this.store.filters(), ...changes }, view, month);
    void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl });
  }
}
