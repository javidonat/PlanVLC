import { Component, input, output } from '@angular/core';
import { LucideArrowUpDown } from '@lucide/angular';

export interface SortOption {
  value: string;
  label: string;
}

// Desplegable de orden reutilizable (solo UI). Emite el orden elegido; la página decide qué hacer
@Component({
  selector: 'app-sort-select',
  imports: [LucideArrowUpDown],
  template: `
    <label class="flex items-center gap-2 text-sm">
      <svg lucideArrowUpDown width="16" height="16" class="shrink-0 text-gris-400"></svg>
      <span class="sr-only sm:not-sr-only sm:whitespace-nowrap sm:text-gris-500">{{ label() }}</span>
      <select [value]="value()" (change)="valueChange.emit($any($event.target).value)"
        class="h-10 rounded-xl border border-gris-200 bg-superficie pl-3 pr-8 font-semibold text-gris-800 outline-none focus:border-marca-500">
        @for (option of options(); track option.value) {
          <option [value]="option.value" [selected]="option.value === value()">{{ option.label }}</option>
        }
      </select>
    </label>
  `,
})
export class SortSelect {
  label = input('Ordenar por');
  options = input<SortOption[]>([]);
  value = input('');
  valueChange = output<string>();
}
