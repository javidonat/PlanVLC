import { Component, input, output } from '@angular/core';
import { LucideEye, LucidePencil, LucideTrash2 } from '@lucide/angular';
import { Organizer, organizerStatusLabel, organizerTypeLabel } from '../../../../core/models/organizer.model';

// Una fila del listado. Se usa como atributo (<tr app-organizer-row>) para no romper la tabla.
// No llama a la API: avisa al padre con outputs.
@Component({
  selector: 'tr[app-organizer-row]',
  imports: [LucideEye, LucidePencil, LucideTrash2],
  templateUrl: './organizer-row.html',
  host: { class: 'hover:bg-slate-50/70' },
})
export class OrganizerRow {
  organizer = input.required<Organizer>();
  busy = input(false);
  viewClick = output<Organizer>();
  editClick = output<Organizer>();
  toggleClick = output<Organizer>();
  deleteClick = output<Organizer>();

  readonly organizerStatusLabel = organizerStatusLabel;
  readonly organizerTypeLabel = organizerTypeLabel;
}
