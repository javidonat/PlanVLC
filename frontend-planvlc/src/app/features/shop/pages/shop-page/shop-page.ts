import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideSlidersHorizontal } from '@lucide/angular';
import { ShopFilters, ShopPlan } from '../../../../core/models/shop.model';
import { ShopService } from '../../../../core/services/shop.service';
import { ShopStore } from '../../../../core/stores/shop.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SearchBar } from '../../../../shared/components/search-bar/search-bar';
import { FilterOption, SelectFilter } from '../../../../shared/components/select-filter/select-filter';
import { PriceFilter, PriceRange } from '../../../../shared/components/price-filter/price-filter';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { PlanList } from '../../components/plan-list/plan-list';
import { filtersFromUrl, filtersToUrl } from '../../utils/shop-url';

type FilterKey = 'category' | 'organizer' | 'venue';

// Shop: listado de planes con filtros, búsqueda y paginación.
// La URL es la única fuente de verdad: los componentes avisan, la página cambia la URL
// y cada cambio de la URL (también atrás/adelante del navegador o un enlace del home)
// guarda los filtros en el store y pide los planes.
@Component({
  selector: 'app-shop-page',
  imports: [LucideSlidersHorizontal, SearchBar, SelectFilter, PriceFilter, Pagination, SkeletonLoader, EmptyState, ErrorState, PlanList],
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

  // Cuántos filtros hay puestos (precio cuenta como uno). La búsqueda va aparte
  readonly activeFilters = computed(() => {
    const { category, organizer, venue, minPrice, maxPrice } = this.store.filters();
    return [category, organizer, venue].filter(Boolean).length + (minPrice !== null || maxPrice !== null ? 1 : 0);
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.store.setFilters(filtersFromUrl(params));
      void this.loadPlans();
    });
    inject(DestroyRef).onDestroy(() => this.abortController?.abort());
  }

  ngOnInit(): void {
    // Opciones de los filtros (las mismas que los carruseles del home)
    if (!this.store.catalogLoaded()) void this.loadCatalog();
  }

  async loadPlans(): Promise<void> {
    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;

    try {
      this.store.setLoading(true);
      this.store.setError(null);
      const res = await this.service.getPlans(this.store.filters(), controller.signal);
      this.store.setPlans(res.data, { total: res.total, page: res.page, limit: res.limit, totalPages: res.totalPages });
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

  onFilter(key: FilterKey, value: string | null): void {
    this.updateUrl({ [key]: value, page: 1 });
  }

  onPrice(range: PriceRange): void {
    this.updateUrl({ minPrice: range.min, maxPrice: range.max, page: 1 });
  }

  onClear(): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  onPage(page: number): void {
    this.updateUrl({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPlan(plan: ShopPlan): void {
    void this.router.navigate(['/planes', plan.slug]);
  }

  private updateUrl(changes: Partial<ShopFilters>, replaceUrl = false): void {
    const filters = { ...this.store.filters(), ...changes };
    void this.router.navigate([], { relativeTo: this.route, queryParams: filtersToUrl(filters), replaceUrl });
  }
}
