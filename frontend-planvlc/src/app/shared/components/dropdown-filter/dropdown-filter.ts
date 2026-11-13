import { Component, input, output } from '@angular/core';
import { FilterOption } from '../select-filter/select-filter';

// Filtro desplegable reutilizable (solo UI): elige una opción o "todos" (null).
// Emite el valor elegido; qué hacer con él (URL, store, petición) lo decide la página
@Component({
  selector: 'app-dropdown-filter',
  template: `
    <label class="block text-sm">
      <span class="mb-1 block font-semibold text-gris-700">{{ label() }}</span>
      <select (change)="onChange($any($event.target).value)"
        class="h-10 w-full rounded-xl border border-gris-200 bg-superficie pl-3 pr-8 text-gris-800 outline-none focus:border-marca-500">
        <option value="" [selected]="value() === null">{{ allLabel() }}</option>
        @for (option of options(); track option.value) {
          <option [value]="option.value" [selected]="option.value === value()">{{ option.label }}</option>
        }
      </select>
    </label>
  `,
})
export class DropdownFilter {
  label = input.required<string>();
  options = input<FilterOption[]>([]);
  value = input<string | null>(null);
  allLabel = input('Todos');
  valueChange = output<string | null>();

  onChange(value: string): void {
    this.valueChange.emit(value || null);
  }
}
