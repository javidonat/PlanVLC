import { Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideBuilding2, LucideCalendarDays, LucideMapPin, LucideTicket, LucideUsers } from '@lucide/angular';
import { ImageRef } from '../../../../core/models/plan.model';
import { ShopPlan, ShopSession } from '../../../../core/models/shop.model';
import { ChatMessage, PlanChatRequest } from '../../../../core/models/ai.model';
import { CommentDraft, CommentStats, PlanComment } from '../../../../core/models/comment.model';
import { ShopService } from '../../../../core/services/shop.service';
import { AiService } from '../../../../core/services/ai.service';
import { CommentsService } from '../../../../core/services/comments.service';
import { LikesService } from '../../../../core/services/likes.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { AlertService } from '../../../../core/services/alert.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { ShopStore } from '../../../../core/stores/shop.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { Carousel } from '../../../../shared/components/carousel/carousel';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SessionList } from '../../components/session-list/session-list';
import { PlanChat } from '../../components/plan-chat/plan-chat';
import { PlanComments } from '../../components/plan-comments/plan-comments';
import { PlanLikeButton } from '../../components/plan-like-button/plan-like-button';
import { PlanWishlistButton } from '../../components/plan-wishlist-button/plan-wishlist-button';
import { filtersToUrl } from '../../utils/shop-url';
import { isSoldOut, planPriceText, priceText, sessionTimeText } from '../../utils/shop.utils';

// Detalle de un plan (/planes/:slug): carrusel de fotos, información y sus sesiones (variantes).
// Se puede elegir una sesión; la reserva se implementará más adelante sobre selectedSession.
// Tiene un chat con el asistente de IA, que responde con los datos del plan que ya se ven en la página,
// y las opiniones (comentarios) con un resumen hecho por el agente de IA.
// Like y lista de deseos: sin sesión, el botón lleva al login y vuelve al plan
@Component({
  selector: 'app-plan-detail-page',
  imports: [RouterLink, LucideArrowLeft, LucideBuilding2, LucideCalendarDays, LucideMapPin, LucideTicket, LucideUsers, Carousel, SkeletonLoader, ErrorState, SessionList, PlanChat, PlanComments, PlanLikeButton, PlanWishlistButton],
  templateUrl: './plan-detail-page.html',
})
export class PlanDetailPage {
  private readonly service = inject(ShopService);
  private readonly store = inject(ShopStore);
  private readonly ai = inject(AiService);
  private readonly commentsService = inject(CommentsService);
  private readonly alerts = inject(AlertService);
  private readonly likesService = inject(LikesService);
  private readonly wishlistService = inject(WishlistService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthStore);

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

  // Opiniones: se cargan de 5 en 5 ("Ver más" añade la página siguiente)
  readonly comments = signal<PlanComment[]>([]);
  readonly commentStats = signal<CommentStats>({ count: 0, average: null });
  readonly commentsPage = signal(1);
  readonly commentsTotalPages = signal(0);
  readonly commentsLoading = signal(false);
  readonly commentsError = signal<string | null>(null);
  readonly commentSubmitting = signal(false);
  readonly commentSubmitError = signal<string | null>(null);
  readonly deletingCommentId = signal<string | null>(null);
  // Resumen de las opiniones hecho por la IA (solo con 2 o más comentarios)
  readonly reviewsSummary = signal<string | null>(null);
  readonly reviewsSummaryLoading = signal(false);
  readonly hasMoreComments = computed(() => this.commentsPage() < this.commentsTotalPages());
  readonly returnUrl = computed(() => `/planes/${this.slug()}`);

  // Like y lista de deseos del usuario de la sesión
  readonly liked = signal(false);
  readonly likesCount = signal(0);
  readonly likeBusy = signal(false);
  readonly inWishlist = signal(false);
  readonly wishlistBusy = signal(false);

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
  private commentsAbortController: AbortController | null = null;
  private summaryAbortController: AbortController | null = null;
  private reactionsAbortController: AbortController | null = null;
  private static readonly COMMENTS_PER_PAGE = 5;
  private static readonly MIN_COMMENTS_FOR_SUMMARY = 2;
  private static readonly MAX_COMMENTS_FOR_SUMMARY = 50; // lo máximo que acepta el servicio de IA

  constructor() {
    // Si cambia el slug (otro plan sin salir de la página), se carga el nuevo
    effect(() => {
      const slug = this.slug();
      untracked(() => void this.load(slug));
    });
    inject(DestroyRef).onDestroy(() => {
      this.abortController?.abort();
      this.chatAbortController?.abort();
      this.commentsAbortController?.abort();
      this.summaryAbortController?.abort();
      this.reactionsAbortController?.abort();
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
      this.resetComments();
      const [plan, sessions] = await Promise.all([
        this.service.getPlanBySlug(slug, controller.signal),
        this.service.getPlanSessions(slug, controller.signal),
      ]);
      this.plan.set(plan.data);
      this.sessions.set(sessions.data);
      void this.loadComments(slug, 1);
      void this.loadReviewsSummary(slug, plan.data);
      void this.loadReactions(plan.data._id);
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

  // Likes del plan (público) y, con sesión, si el usuario le ha dado like y si lo tiene en su lista de deseos
  async loadReactions(planId: string): Promise<void> {
    this.reactionsAbortController?.abort();
    const controller = new AbortController();
    this.reactionsAbortController = controller;
    this.liked.set(false);
    this.inWishlist.set(false);
    try {
      const loggedIn = this.auth.isAuthenticated();
      const [count, myLikes, wishlist] = await Promise.all([
        this.likesService.getCount(planId, controller.signal),
        loggedIn ? this.likesService.getMine(controller.signal) : null,
        loggedIn ? this.wishlistService.getMine(controller.signal) : null,
      ]);
      this.likesCount.set(count.data.count);
      this.liked.set(myLikes?.data.includes(planId) ?? false);
      this.inWishlist.set(wishlist?.data.some(item => item.planId._id === planId) ?? false);
    } catch {
      // Si falla, los botones se quedan sin marcar: el resto de la página sigue funcionando
    }
  }

  // Like / quitar like. Sin sesión → login (y vuelta a este plan)
  async onToggleLike(): Promise<void> {
    const plan = this.plan();
    if (!plan || this.likeBusy()) return;
    if (!this.auth.isAuthenticated()) return this.goToLogin();
    try {
      this.likeBusy.set(true);
      const res = this.liked() ? await this.likesService.unlike(plan._id) : await this.likesService.like(plan._id);
      this.liked.set(res.data.liked);
      this.likesCount.set(res.data.count);
    } catch {
      // El interceptor ya muestra el error (409 si ya le habías dado like, 404 si no). Se vuelve a leer el estado real
      await this.loadReactions(plan._id);
    } finally {
      this.likeBusy.set(false);
    }
  }

  // Guardar / quitar de la lista de deseos. Sin sesión → login (y vuelta a este plan)
  async onToggleWishlist(): Promise<void> {
    const plan = this.plan();
    if (!plan || this.wishlistBusy()) return;
    if (!this.auth.isAuthenticated()) return this.goToLogin();
    try {
      this.wishlistBusy.set(true);
      const res = this.inWishlist() ? await this.wishlistService.remove(plan._id) : await this.wishlistService.add(plan._id);
      this.inWishlist.set(res.data.inWishlist);
    } catch {
      await this.loadReactions(plan._id);
    } finally {
      this.wishlistBusy.set(false);
    }
  }

  private goToLogin(): void {
    void this.router.navigate(['/login'], { queryParams: { returnUrl: this.returnUrl() } });
  }

  // Una página de comentarios: la 1 sustituye la lista, las siguientes se añaden al final
  async loadComments(slug: string, page: number): Promise<void> {
    this.commentsAbortController?.abort();
    const controller = new AbortController();
    this.commentsAbortController = controller;
    try {
      this.commentsLoading.set(true);
      this.commentsError.set(null);
      const res = await this.commentsService.getByPlan(slug, page, PlanDetailPage.COMMENTS_PER_PAGE, controller.signal);
      this.comments.update(current => (page === 1 ? res.data : [...current, ...res.data]));
      this.commentStats.set(res.stats);
      this.commentsPage.set(res.page);
      this.commentsTotalPages.set(res.totalPages);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      this.commentsError.set(apiError(error).message);
    } finally {
      if (this.commentsAbortController === controller) this.commentsLoading.set(false);
    }
  }

  onLoadMoreComments(): void {
    void this.loadComments(this.slug(), this.commentsPage() + 1);
  }

  // El agente de IA resume las opiniones. Recibe los últimos comentarios que se ven en la web (no accede a la base de datos)
  async loadReviewsSummary(slug: string, plan: ShopPlan): Promise<void> {
    this.summaryAbortController?.abort();
    const controller = new AbortController();
    this.summaryAbortController = controller;
    try {
      this.reviewsSummaryLoading.set(true);
      const res = await this.commentsService.getByPlan(slug, 1, PlanDetailPage.MAX_COMMENTS_FOR_SUMMARY, controller.signal);
      if (res.data.length < PlanDetailPage.MIN_COMMENTS_FOR_SUMMARY) {
        this.reviewsSummary.set(null);
        return;
      }
      const comments = res.data.map(({ rating, text }) => ({ rating, text }));
      const analysis = await this.ai.analyzeReviews({ plan: { title: plan.title }, comments }, controller.signal);
      this.reviewsSummary.set(analysis.data.summary);
    } catch {
      // Si la IA falla no se enseña el resumen: las opiniones se siguen viendo igual
      if (!controller.signal.aborted) this.reviewsSummary.set(null);
    } finally {
      if (this.summaryAbortController === controller) this.reviewsSummaryLoading.set(false);
    }
  }

  // Publicar exige sesión (el botón solo se ve logueado y el backend lo vuelve a comprobar)
  async onSubmitComment(draft: CommentDraft): Promise<void> {
    const plan = this.plan();
    if (!plan || this.commentSubmitting()) return;
    try {
      this.commentSubmitting.set(true);
      this.commentSubmitError.set(null);
      await this.commentsService.create({ planId: plan._id, ...draft });
      await this.refreshComments(plan);
    } catch (error) {
      this.commentSubmitError.set(apiError(error).message);
    } finally {
      this.commentSubmitting.set(false);
    }
  }

  // Cada usuario borra solo los suyos y el admin todos: si no, el backend responde 403 (lo enseña el interceptor)
  async onDeleteComment(comment: PlanComment): Promise<void> {
    const plan = this.plan();
    if (!plan) return;
    const confirmed = await this.alerts.confirm('Borrar comentario', 'Se borrará el comentario y dejará de verse en el plan.', 'Borrar');
    if (!confirmed) return;
    try {
      this.deletingCommentId.set(comment._id);
      await this.commentsService.softDelete(comment._id);
      await this.refreshComments(plan);
    } catch {
      // El interceptor ya muestra el error
    } finally {
      this.deletingCommentId.set(null);
    }
  }

  // Tras publicar o borrar: primera página, media nueva y resumen nuevo
  private async refreshComments(plan: ShopPlan): Promise<void> {
    void this.loadReviewsSummary(plan.slug, plan);
    await this.loadComments(plan.slug, 1);
  }

  private resetComments(): void {
    this.commentsAbortController?.abort();
    this.summaryAbortController?.abort();
    this.comments.set([]);
    this.commentStats.set({ count: 0, average: null });
    this.commentsPage.set(1);
    this.commentsTotalPages.set(0);
    this.commentsError.set(null);
    this.commentSubmitError.set(null);
    this.commentsLoading.set(false);
    this.reviewsSummary.set(null);
    this.reviewsSummaryLoading.set(false);
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
