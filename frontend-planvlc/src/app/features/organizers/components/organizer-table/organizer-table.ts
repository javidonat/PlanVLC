import { Component, input, output } from '@angular/core';
import { Organizer } from '../../../../core/models/organizer.model';
import { OrganizerRow } from '../organizer-row/organizer-row';

// Listado de organizadores: pinta la tabla y reenvía los eventos de cada fila al padre
@Component({
  selector: 'app-organizer-table',
  imports: [OrganizerRow],
  templateUrl: './organizer-table.html',
})
export class OrganizerTable {
  organizers = input.required<Organizer[]>();
  busyId = input<string | null>(null);
  viewOrganizer = output<Organizer>();
  editOrganizer = output<Organizer>();
  toggleOrganizer = output<Organizer>();
  deleteOrganizer = output<Organizer>();
}
