import { Component, ElementRef, afterNextRender, input, signal, viewChild } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';

// Carrusel reutilizable (solo UI): una fila con scroll horizontal y flechas.
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
    <div class="relative">
      <div #track (scroll)="updateArrows()" role="region" [attr.aria-label]="label()" tabindex="0"
        class="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:thin]">
        <ng-content />
      </div>
      @if (canPrev()) {
        <button type="button" (click)="scroll(-1)" aria-label="Anteriores" class="absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gris-200 bg-superficie text-gris-700 shadow-md hover:bg-gris-50 md:flex"><svg lucideChevronLeft width="18" height="18"></svg></button>
      }
      @if (canNext()) {
        <button type="button" (click)="scroll(1)" aria-label="Siguientes" class="absolute right-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-gris-200 bg-superficie text-gris-700 shadow-md hover:bg-gris-50 md:flex"><svg lucideChevronRight width="18" height="18"></svg></button>
      }
    </div>
  `,
})
export class Carousel {
  label = input(''); // para lectores de pantalla

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  readonly canPrev = signal(false);
  readonly canNext = signal(false);

  constructor() {
    // Las flechas dependen del ancho real: se calculan cuando ya está pintado
    afterNextRender(() => this.updateArrows());
  }

  // Avanza o retrocede casi una "pantalla" del carrusel
  scroll(direction: 1 | -1): void {
    const el = this.track().nativeElement;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  }

  updateArrows(): void {
    const el = this.track().nativeElement;
    this.canPrev.set(el.scrollLeft > 4);
    this.canNext.set(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }
}
