import { Component, input, output } from '@angular/core';
import { ShopPlan } from '../../../../core/models/shop.model';
import { PlanCard } from '../plan-card/plan-card';

// Listado de planes (List + Card): pinta la rejilla de cards y reenvía el plan elegido al padre
@Component({
  selector: 'app-plan-list',
  imports: [PlanCard],
  template: `
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      @for (plan of plans(); track plan._id) {
        <app-plan-card [plan]="plan" (selected)="planSelect.emit($event)" />
      }
    </div>
  `,
})
export class PlanList {
  plans = input.required<ShopPlan[]>();
  planSelect = output<ShopPlan>();
}
