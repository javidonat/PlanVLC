import { Component, input, output } from '@angular/core';

export interface FilterOption {
  value: string;
  label: string;
}

// Filtro reutilizable (solo UI): un desplegable con la opción "todas" (null) y las del padre.
// Emite el valor elegido; qué hacer con él (URL, store, petición) lo decide la página.
@Component({
  selector: 'app-select-filter',
  template: `
    <label class="block">
      <span class="field-label">{{ label() }}</span>
      <select class="field-input" [value]="value() ?? ''" (change)="onChange($any($event.target).value)">
        <option value="">{{ allLabel() }}</option>
        @for (option of options(); track option.value) {
          <option [value]="option.value" [selected]="option.value === value()">{{ option.label }}</option>
        }
      </select>
    </label>
  `,
})
export class SelectFilter {
  label = input.required<string>();
  options = input<FilterOption[]>([]);
  value = input<string | null>(null);
  allLabel = input('Todos');
  valueChange = output<string | null>();

  onChange(value: string): void {
    this.valueChange.emit(value || null);
  }
}
