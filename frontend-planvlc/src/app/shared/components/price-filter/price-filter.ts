import { Component, input, linkedSignal, output } from '@angular/core';

export interface PriceRange {
  min: number | null; // null = sin mínimo
  max: number | null; // null = sin máximo
}

// Filtro de precio reutilizable (solo UI): mínimo y máximo en euros.
// Emite el rango al salir del campo o pulsar Enter (no en cada tecla); qué hacer con él lo decide la página.
@Component({
  selector: 'app-price-filter',
  template: `
    <fieldset>
      <legend class="field-label">{{ label() }}</legend>
      <div class="flex items-center gap-2">
        <input type="number" min="0" step="1" inputmode="numeric" placeholder="Mín." aria-label="Precio mínimo en euros"
          class="field-input" [value]="minText()" (input)="minText.set($any($event.target).value)" (change)="emit()" />
        <span class="text-gris-400" aria-hidden="true">–</span>
        <input type="number" min="0" step="1" inputmode="numeric" placeholder="Máx." aria-label="Precio máximo en euros"
          class="field-input" [value]="maxText()" (input)="maxText.set($any($event.target).value)" (change)="emit()" />
        <span class="text-sm font-semibold text-gris-500" aria-hidden="true">€</span>
      </div>
    </fieldset>
  `,
})
export class PriceFilter {
  label = input('Precio');
  min = input<number | null>(null);
  max = input<number | null>(null);
  rangeChange = output<PriceRange>();

  // Lo que hay escrito. Si cambian min/max (ej. volver atrás en el navegador), se actualiza
  readonly minText = linkedSignal(() => this.min()?.toString() ?? '');
  readonly maxText = linkedSignal(() => this.max()?.toString() ?? '');

  emit(): void {
    let min = this.toPrice(this.minText());
    let max = this.toPrice(this.maxText());
    if (min !== null && max !== null && min > max) [min, max] = [max, min]; // si están al revés se ordenan
    this.minText.set(min?.toString() ?? '');
    this.maxText.set(max?.toString() ?? '');
    if (min === this.min() && max === this.max()) return; // no ha cambiado nada
    this.rangeChange.emit({ min, max });
  }

  // Texto → euros (vacío o no válido = sin límite)
  private toPrice(text: string): number | null {
    if (text.trim() === '') return null;
    const value = Number(text);
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
}
