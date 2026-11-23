import { Component, input, output } from '@angular/core';
import { LucideBookmark } from '@lucide/angular';

// Botón para guardar un plan en la lista de deseos. Solo UI: avisa al padre (toggle).
// Guardarlo o quitarlo (y pedir sesión si no la hay) lo hace la página
@Component({
  selector: 'app-plan-wishlist-button',
  imports: [LucideBookmark],
  template: `
    <button type="button" (click)="toggle.emit()" [disabled]="busy()" [attr.aria-pressed]="saved()"
      [class]="saved() ? 'border-marca-200 bg-marca-50 text-marca-700' : 'border-gris-200 bg-superficie text-gris-700 hover:bg-gris-50'"
      class="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60">
      <svg lucideBookmark width="18" height="18" [class.fill-current]="saved()"></svg>
      {{ saved() ? 'En tu lista de deseos' : 'Añadir a la lista de deseos' }}
    </button>
  `,
})
export class PlanWishlistButton {
  saved = input(false);
  busy = input(false);
  toggle = output<void>();
}
