import { Component, ElementRef, afterNextRender, computed, input, signal, viewChild } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';

// Carrusel reutilizable (solo UI): una fila con scroll horizontal, sin la barra gris del navegador.
// Debajo lleva puntos (pocas "pantallas") o una barra de progreso (muchas) que dicen por dónde vas,
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
        class="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth rounded-2xl outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-marca-400 [&::-webkit-scrollbar]:hidden">
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

    <!-- Por dónde vas: puntos si hay pocas pantallas, barra si hay muchas. Sin scroll, nada -->
    @if (pages() > 1) {
      @if (pages() <= maxDots) {
        <div class="mt-4 flex justify-center gap-1.5">
          @for (page of pageList(); track page) {
            <button type="button" (click)="goTo(page)" [attr.aria-label]="'Ir a la pantalla ' + (page + 1)" [attr.aria-current]="page === current() ? 'true' : null"
              class="h-2 rounded-full transition-all duration-300"
              [class]="page === current() ? 'w-6 bg-marca-600' : 'w-2 bg-gris-300 hover:bg-gris-400'"></button>
          }
        </div>
      } @else {
        <div class="mx-auto mt-4 h-1.5 w-32 overflow-hidden rounded-full bg-gris-200" aria-hidden="true">
          <div class="h-full rounded-full bg-marca-600 transition-[margin] duration-150" [style.width.%]="thumbWidth()" [style.margin-left.%]="thumbOffset()"></div>
        </div>
      }
    }
  `,
})
export class Carousel {
  label = input(''); // para lectores de pantalla
  fade = input(true); // difuminar los bordes (sin él para fotos a todo el ancho)

  readonly maxDots = 8;
  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  readonly canPrev = signal(false);
  readonly canNext = signal(false);
  readonly pages = signal(1); // cuántas "pantallas" de ancho tiene el contenido
  readonly current = signal(0);
  private readonly progress = signal(0); // 0 al principio, 1 al final
  private readonly visible = signal(1); // parte visible del total (0-1)

  readonly pageList = computed(() => Array.from({ length: this.pages() }, (_, index) => index));
  readonly thumbWidth = computed(() => Math.max(this.visible() * 100, 15));
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

  goTo(page: number): void {
    const el = this.track().nativeElement;
    el.scrollTo({ left: page * el.clientWidth, behavior: 'smooth' });
  }

  updateArrows(): void {
    const el = this.track().nativeElement;
    const max = el.scrollWidth - el.clientWidth;
    this.canPrev.set(el.scrollLeft > 4);
    this.canNext.set(el.scrollLeft < max - 4);
    this.pages.set(max > 4 ? Math.ceil(el.scrollWidth / el.clientWidth - 0.05) : 1);
    this.current.set(this.canNext() ? Math.round(el.scrollLeft / el.clientWidth) : this.pages() - 1);
    this.progress.set(max > 0 ? el.scrollLeft / max : 0);
    this.visible.set(el.scrollWidth ? el.clientWidth / el.scrollWidth : 1);
  }
}
