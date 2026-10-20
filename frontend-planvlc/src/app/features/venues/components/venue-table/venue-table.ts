import { Component, input, output } from '@angular/core';
import { Venue } from '../../../../core/models/venue.model';
import { VenueRow } from '../venue-row/venue-row';

// Listado de lugares: pinta la tabla y reenvía los eventos de cada fila al padre
@Component({
  selector: 'app-venue-table',
  imports: [VenueRow],
  templateUrl: './venue-table.html',
})
export class VenueTable {
  venues = input.required<Venue[]>();
  busyId = input<string | null>(null);
  viewVenue = output<Venue>();
  editVenue = output<Venue>();
  toggleVenue = output<Venue>();
  deleteVenue = output<Venue>();
}
