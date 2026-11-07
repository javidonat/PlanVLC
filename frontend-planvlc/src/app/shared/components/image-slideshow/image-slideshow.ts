import { Component, OnDestroy, afterNextRender, input, signal } from '@angular/core';

export interface SlideshowImage {
  url: string;
  alt?: string;
}

// Fotos de fondo que van pasando solas (solo UI). Lo que se pasa como contenido se pinta encima.
// overlayClass oscurece las fotos para que el texto se lea bien.
// Con "reducir movimiento" activado en el sistema no avanza sola (se puede cambiar con los puntos).
@Component({
  selector: 'app-image-slideshow',
  host: { class: 'relative block overflow-hidden' },
  template: `
    @for (image of images(); track image.url; let i = $index) {
      <img [src]="image.url" alt="" aria-hidden="true" [attr.loading]="i === 0 ? 'eager' : 'lazy'"
        class="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
        [class.opacity-0]="i !== current()" />
    }
    @if (images().length) {
      <div class="absolute inset-0" [class]="overlayClass()" aria-hidden="true"></div>
    }

    <div class="relative">
      <ng-content />
    </div>

    @if (images().length > 1) {
      <div class="absolute bottom-4 right-4 flex gap-2">
        @for (image of images(); track image.url; let i = $index) {
          <button type="button" (click)="show(i)" [attr.aria-label]="'Ver foto ' + (i + 1)" [attr.aria-current]="i === current()"
            class="h-2.5 rounded-full bg-white transition-all" [class]="i === current() ? 'w-6' : 'w-2.5 opacity-50 hover:opacity-80'"></button>
        }
      </div>
    }
  `,
})
export class ImageSlideshow implements OnDestroy {
  images = input<SlideshowImage[]>([]);
  interval = input(5000); // ms entre foto y foto
  overlayClass = input('bg-black/50');

  readonly current = signal(0);
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    // Solo en el navegador y si el usuario no ha pedido reducir el movimiento
    afterNextRender(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      this.timer = setInterval(() => this.next(), this.interval());
    });
  }

  show(index: number): void {
    this.current.set(index);
  }

  private next(): void {
    const total = this.images().length;
    if (total > 1) this.current.update(i => (i + 1) % total);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
