import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideSlidersHorizontal } from '@lucide/angular';
import { SHOP_SORTS, ShopCalendarSession, ShopFilters, ShopPlan, ShopSort, ShopView } from '../../../../core/models/shop.model';
import { ShopService } from '../../../../core/services/shop.service';
import { ShopStore } from '../../../../core/stores/shop.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SearchBar } from '../../../../shared/components/search-bar/search-bar';
import { FilterOption, SelectFilter } from '../../../../shared/components/select-filter/select-filter';
import { SortSelect } from '../../../../shared/components/sort-select/sort-select';
import { PriceFilter, PriceRange } from '../../../../shared/components/price-filter/price-filter';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { PlanList } from '../../components/plan-list/plan-list';
import { PlanCalendar } from '../../components/plan-calendar/plan-calendar';
import { ViewOption, ViewSwitcher } from '../../../../shared/components/view-switcher/view-switcher';
import { monthLabel } from '../../utils/calendar.utils';
import { filtersFromUrl, filtersToUrl, monthFromUrl, viewFromUrl } from '../../utils/shop-url';

type FilterKey = 'category' | 'organizer' | 'venue';

// Shop: listado de planes con filtros, búsqueda y paginación.
// La URL es la única fuente de verdad: los componentes avisan, la página cambia la URL
// y cada cambio de la URL (también atrás/adelante del navegador o un enlace del home)
// guarda los filtros en el store y pide los planes.
@Component({
  selector: 'app-shop-page',
  imports: [LucideSlidersHorizontal, SearchBar, SelectFilter, PriceFilter, Pagination, SkeletonLoader, EmptyState, ErrorState, PlanList, PlanCalendar, ViewSwitcher, SortSelect],
  templateUrl: './shop-page.html',
})
export class ShopPage implements OnInit {
  readonly store = inject(ShopStore);
  private readonly service = inject(ShopService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Petición de planes en curso: si llega otra, se cancela (evita race conditions)
  private abortController: AbortController | null = null;

  readonly categoryOptions = computed<FilterOption[]>(() => this.store.categories().map(c => ({ value: c.slug, label: c.name })));
  readonly organizerOptions = computed<FilterOption[]>(() => this.store.organizers().map(o => ({ value: o.slug, label: o.name })));
  readonly venueOptions = computed<FilterOption[]>(() => this.store.venues().map(v => ({ value: v.slug, label: v.name })));

  // Panel de filtros abierto (solo en móvil: en escritorio siempre se ve)
  readonly showFilters = signal(false);

  readonly sortOptions = SHOP_SORTS;

  readonly viewOptions: ViewOption[] = [
    { value: 'grid', label: 'Rejilla', icon: 'grid' },
    { value: 'list', label: 'Lista', icon: 'list' },
    { value: 'calendar', label: 'Calendario', icon: 'calendar' },
  ];

  // Mes del calendario que viene en la URL (null = el que elija el backend)
  private urlMonth: string | null = null;

  // Texto del resultado: "5 planes encontrados" (los filtros aplicados se cuentan en el panel de filtros)
  readonly resultText = computed(() => {
    if (this.store.view() === 'calendar') {
      const total = this.store.calendarSessions().length;
      const month = this.store.calendarMonth();
      return `${total} ${total === 1 ? 'sesión' : 'sesiones'}${month ? ` en ${monthLabel(month)}` : ''}`;
    }
    const total = this.store.pagination().total;
    return `${total} ${total === 1 ? 'plan encontrado' : 'planes encontrados'}`;
  });

  readonly filterCountText = computed(() => {
    const count = this.store.activeFilterCount();
    return `${count} ${count === 1 ? 'filtro aplicado' : 'filtros aplicados'}`;
  });

  constructor() {
    // Cada cambio de la URL: guarda filtros y vista en el store y pide los datos de esa vista
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.store.setFilters(filtersFromUrl(params));
      this.store.setView(viewFromUrl(params));
      this.urlMonth = monthFromUrl(params);
      void this.load();
    });
    inject(DestroyRef).onDestroy(() => this.abortController?.abort());
  }

  ngOnInit(): void {
    // Opciones de los filtros (las mismas que los carruseles del home)
    if (!this.store.catalogLoaded()) void this.loadCatalog();
  }

  // Planes (rejilla y lista) o sesiones del mes (calendario). Una petición nueva cancela la anterior
  async load(): Promise<void> {
    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;

    try {
      this.store.setLoading(true);
      this.store.setError(null);
      if (this.store.view() === 'calendar') {
        const res = await this.service.getSessions(this.store.filters(), this.urlMonth, controller.signal);
        this.store.setCalendar(res.month, res.data);
      } else {
        const res = await this.service.getPlans(this.store.filters(), controller.signal);
        this.store.setPlans(res.data, { total: res.total, page: res.page, limit: res.limit, totalPages: res.totalPages });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return; // la sustituye otra más nueva
      this.store.setError(apiError(error).message);
    } finally {
      // Solo la petición más reciente quita el "cargando"
      if (this.abortController === controller) this.store.setLoading(false);
    }
  }

  async loadCatalog(): Promise<void> {
    try {
      this.store.setCatalogLoading(true);
      this.store.setCatalogError(null);
      const [categories, organizers, venues] = await Promise.all([
        this.service.getCategories(),
        this.service.getOrganizers(),
        this.service.getVenues(),
      ]);
      this.store.setCatalog(categories.data, organizers.data, venues.data);
    } catch (error) {
      // Sin catálogo los filtros salen vacíos, pero el listado funciona igual
      this.store.setCatalogError(apiError(error).message);
    } finally {
      this.store.setCatalogLoading(false);
    }
  }

  // Al buscar o filtrar se vuelve a la página 1
  onSearch(search: string): void {
    this.updateUrl({ search, page: 1 }, true); // replaceUrl: no llena el historial con cada búsqueda
  }

  onFilter(key: FilterKey, values: string[]): void {
    this.updateUrl({ [key]: values, page: 1 });
  }

  onPrice(range: PriceRange): void {
    this.updateUrl({ minPrice: range.min, maxPrice: range.max, page: 1 });
  }

  onSort(sort: string): void {
    this.updateUrl({ sort: sort as ShopSort, page: 1 });
  }

  // Quita filtros y búsqueda; la vista y el orden se quedan
  onClear(): void {
    const { sort } = this.store.filters();
    this.updateUrl({ category: [], organizer: [], venue: [], minPrice: null, maxPrice: null, search: '', page: 1, sort });
  }

  onView(view: string): void {
    this.urlMonth = null; // al volver al calendario, el backend elige el mes
    this.updateUrl({ page: 1 }, false, view as ShopView);
  }

  onMonth(month: string): void {
    this.urlMonth = month;
    this.updateUrl({});
  }

  onSession(session: ShopCalendarSession): void {
    void this.router.navigate(['/planes', session.planId.slug]);
  }

  onPage(page: number): void {
    this.updateUrl({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPlan(plan: ShopPlan): void {
    void this.router.navigate(['/planes', plan.slug]);
  }

  // Filtros + vista (+ mes del calendario) → URL. El resto lo hace la suscripción a la URL
  private updateUrl(changes: Partial<ShopFilters>, replaceUrl = false, view = this.store.view()): void {
    const queryParams = filtersToUrl({ ...this.store.filters(), ...changes });
    if (view !== 'grid') queryParams['view'] = view;
    if (view === 'calendar' && this.urlMonth) queryParams['month'] = this.urlMonth;
    void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl });
  }
}
