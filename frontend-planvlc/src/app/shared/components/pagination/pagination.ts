import { Component, computed, input, output } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';

// Paginación reutilizable (solo UI): anterior, números y siguiente. Emite la página elegida.
// Con muchas páginas muestra la primera, la última y las cercanas a la actual (1 … 4 5 6 … 12)
@Component({
  selector: 'app-pagination',
  imports: [LucideChevronLeft, LucideChevronRight],
  template: `
    @if (totalPages() > 1) {
      <nav class="flex flex-wrap items-center justify-center gap-1.5" aria-label="Paginación">
        <button type="button" [disabled]="page() <= 1" (click)="go(page() - 1)" class="flex h-10 items-center gap-1 rounded-xl border border-gris-200 bg-white px-3 text-sm font-semibold text-gris-700 hover:bg-gris-50 disabled:cursor-not-allowed disabled:opacity-40"><svg lucideChevronLeft width="16" height="16"></svg> Anterior</button>
        @for (item of pages(); track $index) {
          @if (item === null) {
            <span class="px-1 text-gris-400">…</span>
          } @else {
            <button type="button" (click)="go(item)" [attr.aria-current]="item === page() ? 'page' : null"
              [class]="item === page() ? 'border-marca-600 bg-marca-600 text-white' : 'border-gris-200 bg-white text-gris-700 hover:bg-gris-50'"
              class="h-10 min-w-10 rounded-xl border px-3 text-sm font-semibold">{{ item }}</button>
          }
        }
        <button type="button" [disabled]="page() >= totalPages()" (click)="go(page() + 1)" class="flex h-10 items-center gap-1 rounded-xl border border-gris-200 bg-white px-3 text-sm font-semibold text-gris-700 hover:bg-gris-50 disabled:cursor-not-allowed disabled:opacity-40">Siguiente <svg lucideChevronRight width="16" height="16"></svg></button>
      </nav>
    }
  `,
})
export class Pagination {
  page = input.required<number>();
  totalPages = input.required<number>();
  pageChange = output<number>();

  // Números a mostrar; null = hueco (…)
  readonly pages = computed(() => {
    const current = this.page();
    const total = this.totalPages();
    const items: (number | null)[] = [];
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || Math.abs(i - current) <= 1) items.push(i);
      else if (items[items.length - 1] !== null) items.push(null);
    }
    return items;
  });

  go(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.page()) this.pageChange.emit(page);
  }
}
