import { Component, computed, effect, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideLoaderCircle, LucideMessageSquare, LucideSparkles, LucideStar, LucideTrash2 } from '@lucide/angular';
import { CommentDraft, CommentStats, PlanComment } from '../../../../core/models/comment.model';

// Opiniones de un plan en su detalle. Solo UI: pinta la media, el resumen de la IA, el formulario
// y la lista, y avisa al padre (publish, delete, loadMore). Cargar, publicar y borrar lo hace la página
@Component({
  selector: 'app-plan-comments',
  imports: [RouterLink, LucideLoaderCircle, LucideMessageSquare, LucideSparkles, LucideStar, LucideTrash2],
  template: `
    <section class="rounded-2xl border border-gris-200 bg-superficie p-5" aria-labelledby="plan-comments-title">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <h2 id="plan-comments-title" class="flex items-center gap-2 text-xl font-bold text-gris-900">
          <svg lucideMessageSquare width="20" height="20" class="text-marca-600"></svg> Opiniones
        </h2>
        @if (stats().average !== null) {
          <p class="flex items-center gap-2 text-sm text-gris-600">
            <span class="flex" [attr.aria-label]="'Media: ' + stats().average + ' de 5'">
              @for (star of stars; track star) {
                <svg lucideStar width="16" height="16" [class]="star <= roundedAverage() ? 'fill-amber-400 text-amber-400' : 'text-gris-300'"></svg>
              }
            </span>
            <span class="font-bold text-gris-900">{{ stats().average }}</span> · {{ stats().count }} {{ stats().count === 1 ? 'opinión' : 'opiniones' }}
          </p>
        }
      </div>

      <!-- Resumen de las opiniones hecho por el agente de IA -->
      @if (aiLoading()) {
        <p class="mt-4 flex items-center gap-2 rounded-xl bg-marca-50 px-4 py-3 text-sm text-marca-700"><svg lucideLoaderCircle width="16" height="16" class="animate-spin"></svg> Resumiendo las opiniones...</p>
      } @else if (aiSummary(); as summary) {
        <div class="mt-4 rounded-xl bg-marca-50 px-4 py-3">
          <p class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-marca-700"><svg lucideSparkles width="14" height="14"></svg> Resumen de las opiniones (IA)</p>
          <p class="mt-1 text-sm text-gris-800">{{ summary }}</p>
        </div>
      }

      @if (isLoggedIn()) {
        <form (submit)="send($event)" class="mt-5 space-y-3">
          <fieldset>
            <legend class="field-label">Tu valoración</legend>
            <div class="flex gap-1">
              @for (star of stars; track star) {
                <button type="button" (click)="rating.set(star)" [attr.aria-label]="star + (star === 1 ? ' estrella' : ' estrellas')" [attr.aria-pressed]="rating() === star"
                  class="rounded-lg p-1 transition hover:bg-gris-100">
                  <svg lucideStar width="24" height="24" [class]="star <= rating() ? 'fill-amber-400 text-amber-400' : 'text-gris-300'"></svg>
                </button>
              }
            </div>
          </fieldset>
          <div>
            <label for="plan-comment-text" class="field-label">Tu comentario</label>
            <textarea id="plan-comment-text" class="field-input" rows="3" maxlength="1000" placeholder="¿Qué te pareció el plan?"
              [value]="text()" (input)="text.set($any($event.target).value)"></textarea>
          </div>
          @if (submitError(); as message) {
            <p class="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">{{ message }}</p>
          }
          <button type="submit" [disabled]="submitting() || !canSend()"
            class="flex items-center gap-2 rounded-xl bg-marca-600 px-5 py-2.5 font-semibold text-white transition hover:bg-marca-700 disabled:cursor-not-allowed disabled:opacity-50">
            @if (submitting()) { <svg lucideLoaderCircle width="16" height="16" class="animate-spin"></svg> }
            Publicar opinión
          </button>
        </form>
      } @else {
        <p class="mt-5 rounded-xl border border-dashed border-gris-300 px-4 py-3 text-sm text-gris-600">
          <a routerLink="/login" [queryParams]="{ returnUrl: returnUrl() }" class="font-semibold text-marca-700 hover:underline">Inicia sesión</a> para dejar tu opinión.
        </p>
      }

      @if (error(); as message) {
        <p class="mt-5 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">{{ message }}</p>
      } @else if (!loading() && !comments().length) {
        <p class="mt-5 text-sm text-gris-500">Todavía no hay opiniones. ¡Sé el primero en contar qué te pareció!</p>
      }

      <ul class="mt-5 divide-y divide-gris-200">
        @for (comment of comments(); track comment._id) {
          <li class="flex gap-3 py-4">
            @if (comment.userId?.profile?.avatar; as avatar) {
              <img [src]="avatar" alt="" class="size-9 shrink-0 rounded-full bg-gris-100" />
            } @else {
              <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-gris-100 text-sm font-bold text-gris-600">{{ (comment.userId?.name ?? '?')[0] }}</span>
            }
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span class="font-semibold text-gris-900">{{ comment.userId?.name ?? 'Usuario eliminado' }}</span>
                <span class="flex" [attr.aria-label]="comment.rating + ' de 5'">
                  @for (star of stars; track star) {
                    <svg lucideStar width="14" height="14" [class]="star <= comment.rating ? 'fill-amber-400 text-amber-400' : 'text-gris-300'"></svg>
                  }
                </span>
                <span class="text-xs text-gris-500">{{ dateText(comment.createdAt) }}</span>
                @if (canDelete(comment)) {
                  <button type="button" (click)="delete.emit(comment)" [disabled]="deletingId() === comment._id" aria-label="Borrar comentario"
                    class="ml-auto rounded-lg p-1.5 text-gris-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50">
                    <svg lucideTrash2 width="16" height="16"></svg>
                  </button>
                }
              </div>
              <p class="mt-1 whitespace-pre-line break-words text-sm text-gris-700">{{ comment.text }}</p>
            </div>
          </li>
        }
      </ul>

      @if (loading()) {
        <p class="flex items-center gap-2 text-sm text-gris-500"><svg lucideLoaderCircle width="16" height="16" class="animate-spin"></svg> Cargando opiniones...</p>
      } @else if (hasMore()) {
        <button type="button" (click)="loadMore.emit()" class="w-full rounded-xl border border-gris-200 px-4 py-2.5 text-sm font-semibold text-gris-700 transition hover:bg-gris-50">Ver más opiniones</button>
      }
    </section>
  `,
})
export class PlanComments {
  comments = input<PlanComment[]>([]);
  stats = input<CommentStats>({ count: 0, average: null });
  loading = input(false);
  error = input<string | null>(null);
  hasMore = input(false);
  isLoggedIn = input(false);
  currentUserId = input<string | null>(null);
  isAdmin = input(false);
  returnUrl = input('/'); // a dónde vuelve tras iniciar sesión
  submitting = input(false);
  submitError = input<string | null>(null);
  deletingId = input<string | null>(null);
  aiSummary = input<string | null>(null);
  aiLoading = input(false);

  publish = output<CommentDraft>(); // no se llama "submit" para no mezclarse con el evento nativo del formulario
  delete = output<PlanComment>();
  loadMore = output<void>();

  readonly stars = [1, 2, 3, 4, 5];
  readonly rating = signal(0);
  readonly text = signal('');
  readonly roundedAverage = computed(() => Math.round(this.stats().average ?? 0));
  readonly canSend = computed(() => this.rating() > 0 && this.text().trim().length >= 3);

  constructor() {
    // Cuando termina de publicarse sin error, se vacía el formulario
    let wasSubmitting = false;
    effect(() => {
      const submitting = this.submitting();
      if (wasSubmitting && !submitting && !this.submitError()) {
        this.rating.set(0);
        this.text.set('');
      }
      wasSubmitting = submitting;
    });
  }

  // Cada usuario solo puede borrar los suyos; el admin, todos (el backend lo vuelve a comprobar)
  canDelete(comment: PlanComment): boolean {
    return this.isAdmin() || (!!this.currentUserId() && comment.userId?._id === this.currentUserId());
  }

  send(event: Event): void {
    event.preventDefault();
    if (this.submitting() || !this.canSend()) return;
    this.publish.emit({ rating: this.rating(), text: this.text().trim() });
  }

  dateText(value: string): string {
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
  }
}
