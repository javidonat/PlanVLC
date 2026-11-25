import { Component, input, output } from '@angular/core';
import { LucideMinus, LucidePlus } from '@lucide/angular';

// Selector de cantidad (– 2 +). Solo UI: emite la cantidad nueva; qué hacer con ella lo decide el padre
@Component({
  selector: 'app-quantity-stepper',
  imports: [LucideMinus, LucidePlus],
  template: `
    <div class="inline-flex items-center rounded-full border border-gris-200 bg-superficie" role="group" [attr.aria-label]="label()">
      <button type="button" (click)="change(value() - 1)" [disabled]="disabled() || value() <= min()" aria-label="Quitar una"
        class="flex size-9 items-center justify-center rounded-full text-gris-700 transition hover:bg-gris-100 disabled:cursor-not-allowed disabled:opacity-40">
        <svg lucideMinus width="16" height="16"></svg>
      </button>
      <span class="min-w-8 text-center font-semibold tabular-nums text-gris-900" aria-live="polite">{{ value() }}</span>
      <button type="button" (click)="change(value() + 1)" [disabled]="disabled() || value() >= max()" aria-label="Añadir una"
        class="flex size-9 items-center justify-center rounded-full text-gris-700 transition hover:bg-gris-100 disabled:cursor-not-allowed disabled:opacity-40">
        <svg lucidePlus width="16" height="16"></svg>
      </button>
    </div>
  `,
})
export class QuantityStepper {
  value = input.required<number>();
  min = input(1);
  max = input(10);
  disabled = input(false);
  label = input('Cantidad');
  valueChange = output<number>();

  change(value: number): void {
    if (value < this.min() || value > this.max()) return;
    this.valueChange.emit(value);
  }
}
