import { Component, input, output } from '@angular/core';
import { LucideEye, LucideMapPin, LucidePencil, LucideTrash2 } from '@lucide/angular';
import { Venue, venueStatusLabel } from '../../../../core/models/venue.model';

// Una fila del listado. Se usa como atributo (<tr app-venue-row>) para no romper la tabla.
// No llama a la API: avisa al padre con outputs.
@Component({
  selector: 'tr[app-venue-row]',
  imports: [LucideEye, LucideMapPin, LucidePencil, LucideTrash2],
  templateUrl: './venue-row.html',
  host: { class: 'hover:bg-gris-50/70' },
})
export class VenueRow {
  venue = input.required<Venue>();
  busy = input(false);
  viewClick = output<Venue>();
  editClick = output<Venue>();
  toggleClick = output<Venue>();
  deleteClick = output<Venue>();

  readonly venueStatusLabel = venueStatusLabel;
}
