import { Component, input, output } from '@angular/core';
import { LucideHeart } from '@lucide/angular';

// Botón de like de un plan con el número de likes. Solo UI: avisa al padre (toggle).
// Dar o quitar el like (y pedir sesión si no la hay) lo hace la página
@Component({
  selector: 'app-plan-like-button',
  imports: [LucideHeart],
  template: `
    <button type="button" (click)="toggle.emit()" [disabled]="busy()" [attr.aria-pressed]="liked()"
      [attr.aria-label]="liked() ? 'Quitar me gusta' : 'Me gusta'"
      [class]="liked() ? 'border-red-200 bg-red-50 text-red-700' : 'border-gris-200 bg-superficie text-gris-700 hover:bg-gris-50'"
      class="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60">
      <svg lucideHeart width="18" height="18" [class.fill-current]="liked()"></svg>
      <span>{{ count() }}</span>
      <span class="sr-only">{{ count() === 1 ? 'me gusta' : 'me gustas' }}</span>
    </button>
  `,
})
export class PlanLikeButton {
  liked = input(false);
  count = input(0);
  busy = input(false);
  toggle = output<void>();
}
