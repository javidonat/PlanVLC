import { Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideBuilding2, LucideCalendarDays, LucideMapPin, LucideTicket, LucideUsers } from '@lucide/angular';
import { ImageRef } from '../../../../core/models/plan.model';
import { ShopPlan, ShopSession } from '../../../../core/models/shop.model';
import { ChatMessage, PlanChatRequest } from '../../../../core/models/ai.model';
import { ShopService } from '../../../../core/services/shop.service';
import { AiService } from '../../../../core/services/ai.service';
import { ShopStore } from '../../../../core/stores/shop.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { Carousel } from '../../../../shared/components/carousel/carousel';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SessionList } from '../../components/session-list/session-list';
import { PlanChat } from '../../components/plan-chat/plan-chat';
import { filtersToUrl } from '../../utils/shop-url';
import { isSoldOut, planPriceText, priceText, sessionTimeText } from '../../utils/shop.utils';

// Detalle de un plan (/planes/:slug): carrusel de fotos, información y sus sesiones (variantes).
// Se puede elegir una sesión; la reserva se implementará más adelante sobre selectedSession.
// Tiene un chat con el asistente de IA, que responde con los datos del plan que ya se ven en la página
@Component({
  selector: 'app-plan-detail-page',
  imports: [RouterLink, LucideArrowLeft, LucideBuilding2, LucideCalendarDays, LucideMapPin, LucideTicket, LucideUsers, Carousel, SkeletonLoader, ErrorState, SessionList, PlanChat],
  templateUrl: './plan-detail-page.html',
})
export class PlanDetailPage {
  private readonly service = inject(ShopService);
  private readonly store = inject(ShopStore);
  private readonly ai = inject(AiService);

  // :slug de la URL (withComponentInputBinding en app.config.ts)
  readonly slug = input.required<string>();

  readonly plan = signal<ShopPlan | null>(null);
  readonly sessions = signal<ShopSession[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedSessionId = signal<string | null>(null);

  // Chat con el asistente de IA
  readonly chatMessages = signal<ChatMessage[]>([]);
  readonly chatLoading = signal(false);
  readonly chatError = signal<string | null>(null);
  readonly chatSuggestions = ['¿Es apto para niños?', '¿Qué fecha es más barata?', '¿Cómo llego?', '¿Qué me llevo?'];

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
  private chatAbortController: AbortController | null = null;

  constructor() {
    // Si cambia el slug (otro plan sin salir de la página), se carga el nuevo
    effect(() => {
      const slug = this.slug();
      untracked(() => void this.load(slug));
    });
    inject(DestroyRef).onDestroy(() => {
      this.abortController?.abort();
      this.chatAbortController?.abort();
    });
  }

  async load(slug: string): Promise<void> {
    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;

    try {
      this.loading.set(true);
      this.error.set(null);
      this.selectedSessionId.set(null);
      this.resetChat(); // otro plan: conversación nueva
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

  // Envía la pregunta al asistente con los datos del plan y los últimos mensajes de la conversación
  async onAsk(question: string): Promise<void> {
    const plan = this.plan();
    if (!plan || this.chatLoading()) return;
    const messages: ChatMessage[] = [...this.chatMessages(), { role: 'user', content: question }];
    this.chatMessages.set(messages);
    this.chatError.set(null);
    this.chatLoading.set(true);

    const controller = new AbortController();
    this.chatAbortController = controller;
    try {
      const response = await this.ai.askPlan(this.chatRequest(plan, messages.slice(-10)), controller.signal);
      this.chatMessages.update(current => [...current, response.data]);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      this.chatError.set(apiError(error).message);
    } finally {
      if (this.chatAbortController === controller) this.chatLoading.set(false);
    }
  }

  private resetChat(): void {
    this.chatAbortController?.abort();
    this.chatAbortController = null;
    this.chatMessages.set([]);
    this.chatError.set(null);
    this.chatLoading.set(false);
  }

  // Lo que se ve en la página, en el formato que espera el servicio de IA
  // (los mensajes empiezan siempre por una pregunta del usuario)
  private chatRequest(plan: ShopPlan, messages: ChatMessage[]): PlanChatRequest {
    const firstQuestion = messages.findIndex(message => message.role === 'user');
    return {
      plan: {
        title: plan.title,
        shortDescription: plan.shortDescription,
        description: plan.description,
        categories: plan.categoryIds.map(category => category.name),
        organizer: plan.organizerId?.name ?? null,
        venue: { name: plan.venueId.name, address: plan.venueId.address, neighborhood: plan.venueId.neighborhood, city: plan.venueId.city },
        priceFrom: plan.priceFrom,
        minAge: plan.minAge,
        tags: plan.tags,
      },
      sessions: this.sessions().map(({ startDateTime, endDateTime, price, stock }) => ({ startDateTime, endDateTime, price, stock })),
      messages: messages.slice(firstQuestion),
    };
  }

  venueAddress(plan: ShopPlan): string {
    const { address, neighborhood, city } = plan.venueId;
    return [address, neighborhood, city].filter(Boolean).join(', ');
  }
}
