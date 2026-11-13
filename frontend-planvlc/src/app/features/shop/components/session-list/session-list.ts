import { Component, input, output } from '@angular/core';
import { ShopSession } from '../../../../core/models/shop.model';
import { SessionCard } from '../session-card/session-card';

// Sesiones del plan (List + Card): marca la elegida y reenvía la elección al padre
@Component({
  selector: 'app-session-list',
  imports: [SessionCard],
  template: `
    <div class="space-y-3">
      @for (session of sessions(); track session._id) {
        <app-session-card [session]="session" [checked]="session._id === selectedId()" (selected)="sessionSelect.emit($event)" />
      } @empty {
        <p class="rounded-2xl border border-gris-200 bg-superficie p-5 text-gris-500">Este plan no tiene fechas próximas.</p>
      }
    </div>
  `,
})
export class SessionList {
  sessions = input.required<ShopSession[]>();
  selectedId = input<string | null>(null);
  sessionSelect = output<ShopSession>();
}
