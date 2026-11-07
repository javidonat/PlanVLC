import { Component, computed, input, output } from '@angular/core';
import { LucideCheck, LucideClock } from '@lucide/angular';
import { ShopSession } from '../../../../core/models/shop.model';
import { isSoldOut, priceText, sessionTimeText, stockText } from '../../utils/shop.utils';

// Card de una sesión (fecha) del plan. Solo UI: avisa al padre al elegirla.
// Las agotadas se ven pero no se pueden elegir
@Component({
  selector: 'app-session-card',
  imports: [LucideCheck, LucideClock],
  template: `
    <button type="button" (click)="selected.emit(session())" [disabled]="soldOut()" [attr.aria-pressed]="checked()"
      [class]="checked() ? 'border-marca-600 bg-marca-50 ring-2 ring-marca-200' : 'border-gris-200 bg-white hover:border-marca-300'"
      class="flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50">
      <span>
        <span class="flex items-center gap-2 font-semibold text-gris-900"><svg lucideClock width="16" height="16" class="text-gris-400"></svg> {{ sessionTimeText(session()) }}</span>
        <span class="mt-1 block text-sm" [class.text-red-600]="soldOut()" [class.text-gris-500]="!soldOut()">{{ stockText(session()) }}</span>
      </span>
      <span class="flex items-center gap-3">
        <span class="text-lg font-bold text-marca-700">{{ priceText(session().price) }}</span>
        @if (checked()) {
          <span class="flex h-6 w-6 items-center justify-center rounded-full bg-marca-600 text-white"><svg lucideCheck width="14" height="14"></svg></span>
        }
      </span>
    </button>
  `,
})
export class SessionCard {
  session = input.required<ShopSession>();
  checked = input(false); // es la sesión elegida
  selected = output<ShopSession>();

  readonly soldOut = computed(() => isSoldOut(this.session()));
  readonly sessionTimeText = sessionTimeText;
  readonly stockText = stockText;
  readonly priceText = priceText;
}
