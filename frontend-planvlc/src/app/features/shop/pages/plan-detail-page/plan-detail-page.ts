import { Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideBuilding2, LucideCalendarDays, LucideMapPin, LucideTicket, LucideUsers } from '@lucide/angular';
import { ImageRef } from '../../../../core/models/plan.model';
import { ShopPlan, ShopSession } from '../../../../core/models/shop.model';
import { ShopService } from '../../../../core/services/shop.service';
import { ShopStore } from '../../../../core/stores/shop.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { Carousel } from '../../../../shared/components/carousel/carousel';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SessionList } from '../../components/session-list/session-list';
import { filtersToUrl } from '../../utils/shop-url';
import { isSoldOut, planPriceText, priceText, sessionTimeText } from '../../utils/shop.utils';

// Detalle de un plan (/planes/:slug): carrusel de fotos, información y sus sesiones (variantes).
// Se puede elegir una sesión; la reserva se implementará más adelante sobre selectedSession
@Component({
  selector: 'app-plan-detail-page',
  imports: [RouterLink, LucideArrowLeft, LucideBuilding2, LucideCalendarDays, LucideMapPin, LucideTicket, LucideUsers, Carousel, SkeletonLoader, ErrorState, SessionList],
  templateUrl: './plan-detail-page.html',
})
export class PlanDetailPage {
  private readonly service = inject(ShopService);
  private readonly store = inject(ShopStore);

  // :slug de la URL (withComponentInputBinding en app.config.ts)
  readonly slug = input.required<string>();

  readonly plan = signal<ShopPlan | null>(null);
  readonly sessions = signal<ShopSession[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedSessionId = signal<string | null>(null);

  readonly selectedSession = computed(() => this.sessions().find(s => s._id === this.selectedSessionId()) ?? null);

  // Portada y galería en el carrusel
  readonly images = computed<ImageRef[]>(() => {
    const plan = this.plan();
    if (!plan) return [];
    return [plan.coverImage, ...(plan.galleryImages ?? [])].filter((image): image is ImageRef => !!image);
  });

  // "Volver" mantiene los filtros con los que se llegó desde el shop
  // Volver al shop con los mismos filtros, orden y vista (y el mes, si venía del calendario)
  readonly backParams = computed(() => {
    const params = filtersToUrl(this.store.filters());
    const view = this.store.view();
    if (view !== 'grid') params['view'] = view;
    if (view === 'calendar' && this.store.calendarMonth()) params['month'] = this.store.calendarMonth();
    return params;
  });

  readonly planPriceText = planPriceText;
  readonly priceText = priceText;
  readonly sessionTimeText = sessionTimeText;

  private abortController: AbortController | null = null;

  constructor() {
    // Si cambia el slug (otro plan sin salir de la página), se carga el nuevo
    effect(() => {
      const slug = this.slug();
      untracked(() => void this.load(slug));
    });
    inject(DestroyRef).onDestroy(() => this.abortController?.abort());
  }

  async load(slug: string): Promise<void> {
    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;

    try {
      this.loading.set(true);
      this.error.set(null);
      this.selectedSessionId.set(null);
      const [plan, sessions] = await Promise.all([
        this.service.getPlanBySlug(slug, controller.signal),
        this.service.getPlanSessions(slug, controller.signal),
      ]);
      this.plan.set(plan.data);
      this.sessions.set(sessions.data);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      this.error.set(apiError(error).message);
    } finally {
      if (this.abortController === controller) this.loading.set(false);
    }
  }

  onSession(session: ShopSession): void {
    if (isSoldOut(session)) return;
    this.selectedSessionId.set(session._id);
  }

  venueAddress(plan: ShopPlan): string {
    const { address, neighborhood, city } = plan.venueId;
    return [address, neighborhood, city].filter(Boolean).join(', ');
  }
}
