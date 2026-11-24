import { Component, computed, effect, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideLoaderCircle, LucideMessageSquare, LucidePencil, LucideStar, LucideTrash2 } from '@lucide/angular';
import { CommentDraft, PlanComment } from '../../../../core/models/comment.model';

// Formulario "Deja tu opinión" y lista de opiniones de un plan. Solo UI: avisa al padre
// (publish, delete, loadMore). Cargar, publicar y borrar lo hace la página.
// El resumen gráfico (reviews-overview) y el de la IA (reviews-ai-summary) son otros componentes
@Component({
  selector: 'app-plan-comments',
  imports: [RouterLink, LucideLoaderCircle, LucideMessageSquare, LucidePencil, LucideStar, LucideTrash2],
  template: `
    <!-- Deja tu opinión: el formulario se abre con el botón (sin sesión, enlace al login) -->
    <div>
      <h3 class="text-lg font-bold text-gris-900">Deja tu opinión</h3>
      <p class="mt-0.5 text-sm text-gris-500">Te llevará un minuto y ayudarás a otros a decidirse.</p>
      @if (!isLoggedIn()) {
        <a routerLink="/login" [queryParams]="{ returnUrl: returnUrl() }"
          class="mt-3 inline-flex items-center gap-2 rounded-xl bg-marca-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-marca-700">Inicia sesión para opinar</a>
      } @else if (!formOpen()) {
        <button type="button" (click)="formOpen.set(true)"
          class="mt-3 inline-flex items-center gap-2 rounded-xl bg-marca-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-marca-700">
          <svg lucidePencil width="16" height="16"></svg> Añadir opinión
        </button>
      } @else {
        <form (submit)="send($event)" class="mt-4 max-w-2xl space-y-3 rounded-2xl border border-gris-200 p-4">
          <fieldset>
            <legend class="field-label">Tu valoración</legend>
            <div class="flex gap-1">
              @for (star of stars; track star) {
                <button type="button" (click)="rating.set(star)" [attr.aria-label]="star + (star === 1 ? ' estrella' : ' estrellas')" [attr.aria-pressed]="rating() === star"
                  class="rounded-lg p-1 transition hover:bg-gris-100">
                  <svg lucideStar width="26" height="26" [class]="star <= rating() ? 'fill-amber-400 text-amber-400' : 'text-gris-300'"></svg>
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
          <div class="flex flex-wrap gap-2">
            <button type="submit" [disabled]="submitting() || !canSend()"
              class="flex items-center gap-2 rounded-xl bg-marca-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-marca-700 disabled:cursor-not-allowed disabled:opacity-50">
              @if (submitting()) { <svg lucideLoaderCircle width="16" height="16" class="animate-spin"></svg> }
              Publicar opinión
            </button>
            <button type="button" (click)="formOpen.set(false)" class="rounded-xl px-4 py-2.5 text-sm font-semibold text-gris-600 hover:bg-gris-100">Cancelar</button>
          </div>
        </form>
      }
    </div>

    <!-- Aquí la página mete el resumen de la IA (entre el formulario y la lista) -->
    <div class="mt-10 empty:hidden"><ng-content select="[summary]" /></div>

    <!-- Todas las opiniones, por si alguien quiere leerlas -->
    <div class="mt-10">
      <h3 class="flex items-center gap-2 text-lg font-bold text-gris-900"><svg lucideMessageSquare width="18" height="18" class="text-marca-600"></svg> Opiniones de los usuarios</h3>

      @if (error(); as message) {
        <p class="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">{{ message }}</p>
      } @else if (!loading() && !comments().length) {
        <p class="mt-4 text-sm text-gris-500">Todavía no hay opiniones. ¡Sé el primero en contar qué te pareció!</p>
      }

      <ul class="mt-2 divide-y divide-gris-200">
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
    </div>
  `,
})
export class PlanComments {
  comments = input<PlanComment[]>([]);
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

  publish = output<CommentDraft>(); // no se llama "submit" para no mezclarse con el evento nativo del formulario
  delete = output<PlanComment>();
  loadMore = output<void>();

  readonly stars = [1, 2, 3, 4, 5];
  readonly rating = signal(0);
  readonly text = signal('');
  readonly formOpen = signal(false); // el formulario se abre con "Añadir opinión"
  readonly canSend = computed(() => this.rating() > 0 && this.text().trim().length >= 3);

  constructor() {
    // Cuando termina de publicarse sin error, se vacía el formulario
    let wasSubmitting = false;
    effect(() => {
      const submitting = this.submitting();
      if (wasSubmitting && !submitting && !this.submitError()) {
        this.rating.set(0);
        this.text.set('');
        this.formOpen.set(false);
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
