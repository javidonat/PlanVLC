import { Component, ElementRef, afterNextRender, computed, input, signal, viewChild } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';

// Carrusel reutilizable (solo UI): una fila con scroll horizontal, sin la barra gris del navegador.
// Debajo lleva una barra de scroll propia con los colores de la web (se arrastra o se pulsa),
// flechas al pasar el ratón y un difuminado en el borde cuando hay más contenido.
// Lo que se pinta dentro lo decide el padre (<ng-content>): cada elemento necesita
// un ancho fijo y "shrink-0 snap-start", por ejemplo:
//
//   <app-carousel label="Categorías">
//     @for (category of categories; track category._id) {
//       <app-category-card class="w-48 shrink-0 snap-start" [category]="category" />
//     }
//   </app-carousel>
@Component({
  selector: 'app-carousel',
  imports: [LucideChevronLeft, LucideChevronRight],
  host: { '(window:resize)': 'updateArrows()' },
  template: `
    <div class="group relative">
      <div #track (scroll)="updateArrows()" role="region" [attr.aria-label]="label()" tabindex="0"
        [class.snap-x]="!dragging()" [class.snap-mandatory]="!dragging()" [class.scroll-smooth]="!dragging()"
        class="flex gap-4 overflow-x-auto rounded-2xl outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-marca-400 [&::-webkit-scrollbar]:hidden">
        <ng-content />
      </div>

      <!-- Difuminado en los bordes: indica que hay más contenido a ese lado -->
      @if (fade()) {
        <div aria-hidden="true" class="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[var(--fondo)] to-transparent transition-opacity duration-300" [class.opacity-0]="!canPrev()"></div>
        <div aria-hidden="true" class="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--fondo)] to-transparent transition-opacity duration-300" [class.opacity-0]="!canNext()"></div>
      }

      @if (canPrev()) {
        <button type="button" (click)="scroll(-1)" aria-label="Anteriores"
        class="absolute left-3 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-superficie/90 text-gris-800 shadow-lg ring-1 ring-black/5 backdrop-blur transition duration-200 hover:scale-105 hover:bg-superficie md:flex md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        <svg lucideChevronLeft width="20" height="20"></svg>
      </button>
      }
      @if (canNext()) {
        <button type="button" (click)="scroll(1)" aria-label="Siguientes"
        class="absolute right-3 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-superficie/90 text-gris-800 shadow-lg ring-1 ring-black/5 backdrop-blur transition duration-200 hover:scale-105 hover:bg-superficie md:flex md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        <svg lucideChevronRight width="20" height="20"></svg>
      </button>
      }
    </div>

    <!-- Barra de scroll propia, larga como el carrusel y con los colores de la web (la del navegador va oculta).
         Se puede arrastrar el violeta o pulsar en la barra para saltar a ese punto. Sin scroll, no sale -->
    @if (scrollable()) {
      <div #bar (pointerdown)="onBarDown($event)" aria-hidden="true"
        class="group/bar relative mt-4 h-2 cursor-pointer touch-none rounded-full bg-gris-200">
        <div class="absolute inset-y-0 rounded-full bg-gradient-to-r from-marca-500 to-marca-600 transition-[height,top] group-hover/bar:-inset-y-0.5"
          [class.cursor-grab]="!dragging()" [class.cursor-grabbing]="dragging()"
          [style.width.%]="thumbWidth()" [style.left.%]="thumbOffset()"></div>
      </div>
    }
  `,
})
export class Carousel {
  label = input(''); // para lectores de pantalla
  fade = input(true); // difuminar los bordes (sin él para fotos a todo el ancho)

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  readonly canPrev = signal(false);
  readonly canNext = signal(false);
  readonly scrollable = signal(false);
  readonly dragging = signal(false);
  private readonly bar = viewChild<ElementRef<HTMLElement>>('bar');
  private readonly progress = signal(0); // 0 al principio, 1 al final
  private readonly visible = signal(1); // parte visible del total (0-1)

  readonly thumbWidth = computed(() => Math.max(this.visible() * 100, 8));
  readonly thumbOffset = computed(() => this.progress() * (100 - this.thumbWidth()));

  constructor() {
    // Las flechas y los puntos dependen del ancho real: se calculan cuando ya está pintado
    afterNextRender(() => this.updateArrows());
  }

  // Avanza o retrocede casi una "pantalla" del carrusel
  scroll(direction: 1 | -1): void {
    const el = this.track().nativeElement;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  }

  // Pulsar o arrastrar la barra: el carrusel se mueve a esa posición (el centro del violeta sigue al dedo/ratón)
  onBarDown(event: PointerEvent): void {
    const bar = this.bar()?.nativeElement;
    if (!bar) return;
    event.preventDefault();
    bar.setPointerCapture(event.pointerId);
    this.dragging.set(true);
    const el = this.track().nativeElement;
    const moveTo = (clientX: number) => {
      const rect = bar.getBoundingClientRect();
      const thumb = (this.thumbWidth() / 100) * rect.width;
      const ratio = (clientX - rect.left - thumb / 2) / (rect.width - thumb);
      el.scrollTo({ left: Math.min(Math.max(ratio, 0), 1) * (el.scrollWidth - el.clientWidth), behavior: 'instant' });
    };
    moveTo(event.clientX);
    const onMove = (move: PointerEvent) => moveTo(move.clientX);
    const onUp = () => {
      this.dragging.set(false);
      bar.removeEventListener('pointermove', onMove);
      bar.removeEventListener('pointerup', onUp);
      bar.removeEventListener('pointercancel', onUp);
    };
    bar.addEventListener('pointermove', onMove);
    bar.addEventListener('pointerup', onUp);
    bar.addEventListener('pointercancel', onUp);
  }

  updateArrows(): void {
    const el = this.track().nativeElement;
    const max = el.scrollWidth - el.clientWidth;
    this.canPrev.set(el.scrollLeft > 4);
    this.canNext.set(el.scrollLeft < max - 4);
    this.scrollable.set(max > 4);
    this.progress.set(max > 0 ? el.scrollLeft / max : 0);
    this.visible.set(el.scrollWidth ? el.clientWidth / el.scrollWidth : 1);
  }
}
