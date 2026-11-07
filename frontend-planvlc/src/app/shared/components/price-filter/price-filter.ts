import { Component, computed, input, linkedSignal, output } from '@angular/core';

export interface PriceRange {
  min: number | null; // null = sin mínimo
  max: number | null; // null = sin máximo
}

// Filtro de precio reutilizable (solo UI): una barra con dos tiradores (mínimo y máximo, en euros).
// El tirador del máximo al final de la barra significa "sin máximo" (ej. 100 €+).
// Emite el rango al soltar el tirador (no mientras se arrastra); qué hacer con él lo decide la página.
@Component({
  selector: 'app-price-filter',
  template: `
    <fieldset>
      <legend class="field-label flex w-full justify-between gap-2">
        <span>{{ label() }}</span>
        <span class="text-marca-700">{{ rangeText() }}</span>
      </legend>
      <div class="price-range relative h-11">
        <div class="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gris-200"></div>
        <div class="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-marca-500"
          [style.left.%]="percent(low())" [style.right.%]="100 - percent(high())"></div>
        <input type="range" [min]="0" [max]="ceiling()" [step]="step()" [value]="low()" aria-label="Precio mínimo en euros"
          [style.z-index]="low() >= ceiling() ? 1 : null"
          (input)="onLow($any($event.target))" (change)="emit()" />
        <input type="range" [min]="0" [max]="ceiling()" [step]="step()" [value]="high()" aria-label="Precio máximo en euros"
          (input)="onHigh($any($event.target))" (change)="emit()" />
      </div>
    </fieldset>
  `,
  styles: `
    /* Dos barras superpuestas: solo los tiradores reciben el ratón, así se pueden mover los dos */
    .price-range input {
      position: absolute; inset: 0; width: 100%; height: 100%; margin: 0;
      appearance: none; -webkit-appearance: none; background: transparent; pointer-events: none;
    }
    .price-range input:focus { outline: none; }
    .price-range input::-webkit-slider-thumb {
      -webkit-appearance: none; pointer-events: auto; cursor: pointer;
      width: 1.25rem; height: 1.25rem; border-radius: 9999px;
      background: #fff; border: 2px solid var(--color-marca-600); box-shadow: 0 1px 3px rgb(0 0 0 / .2);
    }
    .price-range input::-moz-range-thumb {
      pointer-events: auto; cursor: pointer;
      width: 1.25rem; height: 1.25rem; border-radius: 9999px;
      background: #fff; border: 2px solid var(--color-marca-600); box-shadow: 0 1px 3px rgb(0 0 0 / .2);
    }
    .price-range input:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 4px var(--color-marca-100); }
    .price-range input:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 4px var(--color-marca-100); }
  `,
})
export class PriceFilter {
  label = input('Precio');
  min = input<number | null>(null);
  max = input<number | null>(null);
  ceiling = input(100); // final de la barra (€)
  step = input(5);

  rangeChange = output<PriceRange>();

  // Posición de los tiradores. Si cambian min/max (ej. volver atrás en el navegador), se actualizan
  readonly low = linkedSignal(() => Math.min(this.min() ?? 0, this.ceiling()));
  readonly high = linkedSignal(() => Math.min(this.max() ?? this.ceiling(), this.ceiling()));

  readonly rangeText = computed(() => {
    const low = this.low();
    const high = this.high();
    if (low === 0 && high >= this.ceiling()) return 'Cualquiera';
    if (high === 0) return 'Gratis';
    return `${low} € – ${high >= this.ceiling() ? `${this.ceiling()} €+` : `${high} €`}`;
  });

  percent(value: number): number {
    return (value / this.ceiling()) * 100;
  }

  // Un tirador no puede pasar al otro (si los dos llegan al final, el del mínimo queda encima para poder bajarlo)
  onLow(target: HTMLInputElement): void {
    const value = Math.min(Number(target.value), this.high());
    this.low.set(value);
    target.value = String(value);
  }

  onHigh(target: HTMLInputElement): void {
    const value = Math.max(Number(target.value), this.low());
    this.high.set(value);
    target.value = String(value);
  }

  emit(): void {
    const min = this.low() > 0 ? this.low() : null;
    const max = this.high() < this.ceiling() ? this.high() : null;
    if (min === this.min() && max === this.max()) return; // no ha cambiado nada
    this.rangeChange.emit({ min, max });
  }
}
