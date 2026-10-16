import { Component, input, output } from '@angular/core';
import { Plan } from '../../../../core/models/plan.model';
import { PlanRow } from '../plan-row/plan-row';

// Listado de planes: pinta la tabla y reenvía los eventos de cada fila al padre
@Component({
  selector: 'app-plan-table',
  imports: [PlanRow],
  templateUrl: './plan-table.html',
})
export class PlanTable {
  plans = input.required<Plan[]>();
  busyId = input<string | null>(null);
  editPlan = output<Plan>();
  togglePlan = output<Plan>();
  deletePlan = output<Plan>();
}
