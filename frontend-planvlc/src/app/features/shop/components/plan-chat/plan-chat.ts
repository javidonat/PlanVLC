import { Component, ElementRef, effect, input, output, signal, viewChild } from '@angular/core';
import { LucideBot, LucideLoaderCircle, LucideSend, LucideSparkles } from '@lucide/angular';
import { ChatMessage } from '../../../../core/models/ai.model';

// Chat con el asistente de IA en el detalle de un plan. Solo UI: pinta la conversación
// y avisa al padre con la pregunta (ask). Enviarla al servicio de IA lo hace la página
@Component({
  selector: 'app-plan-chat',
  imports: [LucideBot, LucideLoaderCircle, LucideSend, LucideSparkles],
  template: `
    <section class="rounded-2xl border border-gris-200 bg-superficie p-5" aria-labelledby="plan-chat-title">
      <h2 id="plan-chat-title" class="flex items-center gap-2 text-xl font-bold text-gris-900">
        <svg lucideSparkles width="20" height="20" class="text-marca-600"></svg> Pregúntale a PlanVLC
      </h2>
      <p class="mt-1 text-sm text-gris-500">Resuelve tus dudas sobre este plan. Responde un asistente de IA: puede equivocarse.</p>

      <div #scroller class="mt-4 max-h-96 space-y-3 overflow-y-auto" aria-live="polite">
        @for (message of messages(); track $index) {
          @if (message.role === 'user') {
            <p class="ml-auto w-fit max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-marca-600 px-4 py-2.5 text-sm text-white">{{ message.content }}</p>
          } @else {
            <div class="flex max-w-[85%] gap-2">
              <span class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-marca-50 text-marca-700"><svg lucideBot width="16" height="16"></svg></span>
              <p class="whitespace-pre-line rounded-2xl rounded-tl-sm bg-gris-100 px-4 py-2.5 text-sm text-gris-900">{{ message.content }}</p>
            </div>
          }
        }
        @if (loading()) {
          <p class="flex items-center gap-2 text-sm text-gris-500"><svg lucideLoaderCircle width="16" height="16" class="animate-spin"></svg> Pensando...</p>
        }
      </div>

      @if (!messages().length && suggestions().length) {
        <div class="flex flex-wrap gap-2">
          @for (suggestion of suggestions(); track suggestion) {
            <button type="button" (click)="ask.emit(suggestion)" [disabled]="loading()"
              class="rounded-full border border-marca-200 bg-marca-50 px-3 py-1.5 text-sm font-semibold text-marca-700 transition hover:bg-marca-100 disabled:opacity-50">{{ suggestion }}</button>
          }
        </div>
      }

      @if (error(); as message) {
        <p class="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">{{ message }}</p>
      }

      <form (submit)="send($event)" class="mt-4 flex gap-2">
        <label for="plan-chat-input" class="sr-only">Tu pregunta</label>
        <input id="plan-chat-input" type="text" class="field-input" [value]="draft()" (input)="draft.set($any($event.target).value)"
          maxlength="1000" placeholder="Escribe tu pregunta..." autocomplete="off" />
        <button type="submit" [disabled]="loading() || !draft().trim()" aria-label="Enviar pregunta"
          class="flex shrink-0 items-center justify-center rounded-xl bg-marca-600 px-4 text-white transition hover:bg-marca-700 disabled:cursor-not-allowed disabled:opacity-50">
          <svg lucideSend width="18" height="18"></svg>
        </button>
      </form>
    </section>
  `,
})
export class PlanChat {
  messages = input<ChatMessage[]>([]);
  loading = input(false);
  error = input<string | null>(null);
  suggestions = input<string[]>([]); // preguntas de ejemplo (solo con el chat vacío)
  ask = output<string>();

  readonly draft = signal('');
  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');

  constructor() {
    // Con cada mensaje nuevo (o el "Pensando..."), baja al final de la conversación
    effect(() => {
      this.messages();
      this.loading();
      const element = this.scroller().nativeElement;
      queueMicrotask(() => element.scrollTo({ top: element.scrollHeight }));
    });
  }

  send(event: Event): void {
    event.preventDefault();
    const question = this.draft().trim();
    if (!question || this.loading()) return;
    this.ask.emit(question);
    this.draft.set('');
  }
}
