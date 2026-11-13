import { Component, input, output } from '@angular/core';
import { ShopPlan } from '../../../../core/models/shop.model';
import { PlanCard } from '../plan-card/plan-card';
import { PlanRow } from '../plan-row/plan-row';

// Listado de planes (List + Card): pinta los planes en rejilla (cards) o en lista (filas)
// y reenvía el plan elegido al padre
@Component({
  selector: 'app-plan-list',
  imports: [PlanCard, PlanRow],
  template: `
    @if (layout() === 'list') {
      <div class="space-y-4">
        @for (plan of plans(); track plan._id) {
          <app-plan-row [plan]="plan" (selected)="planSelect.emit($event)" />
        }
      </div>
    } @else {
      <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        @for (plan of plans(); track plan._id) {
          <app-plan-card [plan]="plan" (selected)="planSelect.emit($event)" />
        }
      </div>
    }
  `,
})
export class PlanList {
  plans = input.required<ShopPlan[]>();
  layout = input<'grid' | 'list'>('grid');
  planSelect = output<ShopPlan>();
}
