import { Component, computed, input, output, signal } from '@angular/core';

export interface FilterOption {
  value: string;
  label: string;
}

// Filtro reutilizable (solo UI): lista de casillas para marcar una o varias opciones
// (ninguna marcada = todas). Si hay muchas, enseña las primeras y un "Ver más".
// Emite la lista de valores marcados; qué hacer con ella (URL, store, petición) lo decide la página.
@Component({
  selector: 'app-select-filter',
  template: `
    <fieldset>
      <legend class="mb-2 text-sm font-semibold text-gris-900">{{ label() }}</legend>
      <ul class="space-y-0.5">
        @for (option of visibleOptions(); track option.value) {
          <li>
            <label [class]="itemClass(isChecked(option.value))">
              <input type="checkbox" class="size-4 shrink-0 cursor-pointer rounded accent-marca-600"
                [checked]="isChecked(option.value)" (change)="toggle(option.value)" />
              <span class="truncate">{{ option.label }}</span>
            </label>
          </li>
        }
      </ul>
      @if (options().length > limit()) {
        <button type="button" (click)="expanded.set(!expanded())" class="mt-1 px-3 text-sm font-semibold text-marca-600 hover:text-marca-800">
          {{ expanded() ? 'Ver menos' : 'Ver más (' + (options().length - limit()) + ')' }}
        </button>
      }
    </fieldset>
  `,
})
export class SelectFilter {
  label = input.required<string>();
  options = input<FilterOption[]>([]);
  value = input<string[]>([]); // valores marcados
  limit = input(5); // opciones visibles antes de "Ver más"
  valueChange = output<string[]>();

  readonly expanded = signal(false);

  // Las opciones marcadas se ven siempre, aunque estén entre las ocultas
  readonly visibleOptions = computed(() => {
    const options = this.options();
    if (this.expanded() || options.length <= this.limit()) return options;
    const visible = options.slice(0, this.limit());
    const hiddenChecked = options.slice(this.limit()).filter(o => this.isChecked(o.value));
    return [...visible, ...hiddenChecked];
  });

  isChecked(value: string): boolean {
    return this.value().includes(value);
  }

  itemClass(active: boolean): string {
    const base = 'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition';
    return active ? `${base} bg-marca-50 font-semibold text-marca-700` : `${base} text-gris-600 hover:bg-gris-100 hover:text-gris-900`;
  }

  // Marca o desmarca la opción y emite la lista nueva (en el orden de las opciones)
  toggle(value: string): void {
    const checked = this.isChecked(value) ? this.value().filter(v => v !== value) : [...this.value(), value];
    this.valueChange.emit(this.options().map(o => o.value).filter(v => checked.includes(v)));
  }
}
