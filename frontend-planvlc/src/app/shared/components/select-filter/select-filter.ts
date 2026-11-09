import { Component, computed, input, output, signal } from '@angular/core';
import { LucideCheck } from '@lucide/angular';

export interface FilterOption {
  value: string;
  label: string;
}

// Filtro reutilizable (solo UI): lista de opciones para elegir una ("todas" = null).
// Si hay muchas, enseña las primeras y un "Ver más". Emite el valor elegido;
// qué hacer con él (URL, store, petición) lo decide la página.
@Component({
  selector: 'app-select-filter',
  imports: [LucideCheck],
  template: `
    <fieldset>
      <legend class="mb-2 text-sm font-semibold text-gris-900">{{ label() }}</legend>
      <ul class="space-y-0.5">
        <li>
          <button type="button" (click)="choose(null)" [attr.aria-pressed]="value() === null" [class]="itemClass(value() === null)">
            <span class="truncate">{{ allLabel() }}</span>
            @if (value() === null) { <svg lucideCheck width="16" height="16" class="shrink-0"></svg> }
          </button>
        </li>
        @for (option of visibleOptions(); track option.value) {
          <li>
            <button type="button" (click)="choose(option.value)" [attr.aria-pressed]="option.value === value()" [class]="itemClass(option.value === value())">
              <span class="truncate">{{ option.label }}</span>
              @if (option.value === value()) { <svg lucideCheck width="16" height="16" class="shrink-0"></svg> }
            </button>
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
  value = input<string | null>(null);
  allLabel = input('Todos');
  limit = input(5); // opciones visibles antes de "Ver más"
  valueChange = output<string | null>();

  readonly expanded = signal(false);

  // La opción elegida se ve siempre, aunque esté entre las ocultas
  readonly visibleOptions = computed(() => {
    const options = this.options();
    if (this.expanded() || options.length <= this.limit()) return options;
    const visible = options.slice(0, this.limit());
    const selected = options.find(o => o.value === this.value());
    return selected && !visible.includes(selected) ? [...visible, selected] : visible;
  });

  itemClass(active: boolean): string {
    const base = 'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition';
    return active ? `${base} bg-marca-50 font-semibold text-marca-700` : `${base} text-gris-600 hover:bg-gris-100 hover:text-gris-900`;
  }

  choose(value: string | null): void {
    if (value !== this.value()) this.valueChange.emit(value);
  }
}
