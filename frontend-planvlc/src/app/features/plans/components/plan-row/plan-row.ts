import { Component, input, output } from '@angular/core';
import { LucideCalendarDays, LucideEye, LucideMapPin, LucidePencil, LucideTrash2 } from '@lucide/angular';
import { Plan } from '../../../../core/models/plan.model';
import { statusLabel } from '../../../../core/models/status.model';
import { categoriesLabel, planPriceText, sessionDateText, venueLabel } from '../../utils/plans.utils';

// Una fila del listado. Se usa como atributo (<tr app-plan-row>) para no romper la tabla.
// No llama a la API: avisa al padre con outputs.
@Component({
  selector: 'tr[app-plan-row]',
  imports: [LucideCalendarDays, LucideEye, LucideMapPin, LucidePencil, LucideTrash2],
  templateUrl: './plan-row.html',
  host: { class: 'hover:bg-gris-50/70' },
})
export class PlanRow {
  plan = input.required<Plan>();
  busy = input(false);
  viewClick = output<Plan>();
  editClick = output<Plan>();
  toggleClick = output<Plan>();
  deleteClick = output<Plan>();

  readonly categoriesLabel = categoriesLabel;
  readonly venueLabel = venueLabel;
  readonly planPriceText = planPriceText;
  readonly sessionDateText = sessionDateText;
  readonly statusLabel = statusLabel;
}
