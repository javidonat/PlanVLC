import { Component, input, output } from '@angular/core';
import { AdminProfile } from '../../../../core/models/profile.model';
import { ProfileRow } from '../profile-row/profile-row';

// Listado de perfiles: pinta la tabla y reenvía los eventos de cada fila al padre
@Component({
  selector: 'app-profile-table',
  imports: [ProfileRow],
  templateUrl: './profile-table.html',
})
export class ProfileTable {
  profiles = input.required<AdminProfile[]>();
  editProfile = output<AdminProfile>();
}
