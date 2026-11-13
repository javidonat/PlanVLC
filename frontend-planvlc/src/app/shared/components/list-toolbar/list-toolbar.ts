import { Component, input, output } from '@angular/core';
import { SearchBar } from '../search-bar/search-bar';
import { DropdownFilter } from '../dropdown-filter/dropdown-filter';
import { SortSelect, SortOption } from '../sort-select/sort-select';
import { FilterOption } from '../select-filter/select-filter';

// Un desplegable de la barra: qué filtro es, sus opciones y el valor elegido
export interface ToolbarFilter {
  key: string;
  label: string;
  allLabel?: string;
  options: FilterOption[];
  value: string | null;
}

// Barra de los listados del panel (solo UI): buscador, desplegables de filtros, "Quitar filtros",
// texto del resultado y orden. Avisa de cada cambio; qué hacer con él lo decide la página
@Component({
  selector: 'app-list-toolbar',
  imports: [SearchBar, DropdownFilter, SortSelect],
  host: { class: 'block' },
  template: `
    <div class="mb-5 rounded-2xl border border-gris-200 bg-superficie p-4 shadow-xs">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <app-search-bar class="w-full sm:w-80" [value]="search()" [placeholder]="searchPlaceholder()" (searchChange)="searchChange.emit($event)" />
        <button type="button" (click)="clear.emit()" [disabled]="!canClear()" class="text-sm font-semibold text-marca-600 hover:text-marca-800 disabled:cursor-not-allowed disabled:text-gris-300">Quitar filtros</button>
      </div>
      <div class="grid gap-3 sm:grid-cols-3">
        @for (filter of filters(); track filter.key) {
          <app-dropdown-filter [label]="filter.label" [allLabel]="filter.allLabel ?? 'Todos'" [options]="filter.options" [value]="filter.value"
            (valueChange)="filterChange.emit({ key: filter.key, value: $event })" />
        }
      </div>
    </div>
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gris-500" aria-live="polite">{{ resultText() }}</p>
      <app-sort-select [options]="sortOptions()" [value]="sort()" (valueChange)="sortChange.emit($event)" />
    </div>
  `,
})
export class ListToolbar {
  search = input('');
  searchPlaceholder = input('Buscar…');
  filters = input<ToolbarFilter[]>([]);
  sortOptions = input<SortOption[]>([]);
  sort = input('');
  resultText = input('');
  canClear = input(false);

  searchChange = output<string>();
  filterChange = output<{ key: string; value: string | null }>();
  sortChange = output<string>();
  clear = output<void>();
}
