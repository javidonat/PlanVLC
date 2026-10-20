import { Component, input, output } from '@angular/core';
import { Session } from '../../../../core/models/session.model';
import { SessionRow } from '../session-row/session-row';

// Listado de sesiones: pinta la tabla y reenvía los eventos de cada fila al padre
@Component({
  selector: 'app-session-table',
  imports: [SessionRow],
  templateUrl: './session-table.html',
})
export class SessionTable {
  sessions = input.required<Session[]>();
  busyId = input<string | null>(null);
  viewSession = output<Session>();
  editSession = output<Session>();
  toggleSession = output<Session>();
  deleteSession = output<Session>();
}
