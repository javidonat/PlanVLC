import { Component, input, output } from '@angular/core';
import { LucideCalendarDays, LucideLayoutGrid, LucideList } from '@lucide/angular';
import { ShopView } from '../../../../core/models/shop.model';

// Botones para elegir cómo se ven los planes: rejilla, lista o calendario (solo UI)
@Component({
  selector: 'app-view-switcher',
  imports: [LucideLayoutGrid, LucideList, LucideCalendarDays],
  template: `
    <div class="inline-flex rounded-xl border border-gris-200 bg-superficie p-1" role="group" aria-label="Vista">
      <button type="button" (click)="choose('grid')" [attr.aria-pressed]="value() === 'grid'" [class]="itemClass('grid')" title="Rejilla">
        <svg lucideLayoutGrid width="16" height="16"></svg><span class="hidden sm:inline">Rejilla</span>
      </button>
      <button type="button" (click)="choose('list')" [attr.aria-pressed]="value() === 'list'" [class]="itemClass('list')" title="Lista">
        <svg lucideList width="16" height="16"></svg><span class="hidden sm:inline">Lista</span>
      </button>
      <button type="button" (click)="choose('calendar')" [attr.aria-pressed]="value() === 'calendar'" [class]="itemClass('calendar')" title="Calendario">
        <svg lucideCalendarDays width="16" height="16"></svg><span class="hidden sm:inline">Calendario</span>
      </button>
    </div>
  `,
})
export class ViewSwitcher {
  value = input<ShopView>('grid');
  viewChange = output<ShopView>();

  itemClass(view: ShopView): string {
    const base = 'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition';
    return this.value() === view ? `${base} bg-marca-600 text-white shadow-sm` : `${base} text-gris-600 hover:bg-gris-100 hover:text-gris-900`;
  }

  choose(view: ShopView): void {
    if (view !== this.value()) this.viewChange.emit(view);
  }
}
