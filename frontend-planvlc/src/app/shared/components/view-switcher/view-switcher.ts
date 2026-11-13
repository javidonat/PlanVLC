import { Component, input, output } from '@angular/core';
import { LucideCalendarDays, LucideLayoutGrid, LucideList, LucideTable } from '@lucide/angular';

export type ViewIcon = 'grid' | 'list' | 'calendar' | 'table';

export interface ViewOption {
  value: string;
  label: string;
  icon: ViewIcon;
}

// Botones para elegir cómo se ven los resultados: rejilla, lista, tabla, calendario... (solo UI).
// La página le pasa las vistas que tiene y decide qué hacer con la elegida
@Component({
  selector: 'app-view-switcher',
  imports: [LucideLayoutGrid, LucideList, LucideCalendarDays, LucideTable],
  template: `
    <div class="inline-flex rounded-xl border border-gris-200 bg-superficie p-1" role="group" aria-label="Vista">
      @for (option of options(); track option.value) {
        <button type="button" (click)="choose(option.value)" [attr.aria-pressed]="value() === option.value" [class]="itemClass(option.value)" [title]="option.label">
          @switch (option.icon) {
            @case ('grid') { <svg lucideLayoutGrid width="16" height="16"></svg> }
            @case ('list') { <svg lucideList width="16" height="16"></svg> }
            @case ('table') { <svg lucideTable width="16" height="16"></svg> }
            @case ('calendar') { <svg lucideCalendarDays width="16" height="16"></svg> }
          }
          <span class="hidden sm:inline">{{ option.label }}</span>
        </button>
      }
    </div>
  `,
})
export class ViewSwitcher {
  options = input<ViewOption[]>([]);
  value = input('');
  viewChange = output<string>();

  itemClass(view: string): string {
    const base = 'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition';
    return this.value() === view ? `${base} bg-marca-600 text-white shadow-sm` : `${base} text-gris-600 hover:bg-gris-100 hover:text-gris-900`;
  }

  choose(view: string): void {
    if (view !== this.value()) this.viewChange.emit(view);
  }
}
