import { Component, input, output } from '@angular/core';
import { LucideEye, LucidePencil, LucideTrash2 } from '@lucide/angular';
import { Session } from '../../../../core/models/session.model';
import { statusLabel } from '../../../../core/models/status.model';
import { dateTimeText, limitText, planTitle, priceText } from '../../utils/sessions.utils';

// Una fila del listado. Se usa como atributo (<tr app-session-row>) para no romper la tabla.
// No llama a la API: avisa al padre con outputs.
@Component({
  selector: 'tr[app-session-row]',
  imports: [LucideEye, LucidePencil, LucideTrash2],
  templateUrl: './session-row.html',
  host: { class: 'hover:bg-slate-50/70' },
})
export class SessionRow {
  session = input.required<Session>();
  busy = input(false);
  viewClick = output<Session>();
  editClick = output<Session>();
  toggleClick = output<Session>();
  deleteClick = output<Session>();

  readonly planTitle = planTitle;
  readonly dateTimeText = dateTimeText;
  readonly priceText = priceText;
  readonly limitText = limitText;
  readonly statusLabel = statusLabel;
}
