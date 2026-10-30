import { Component, computed, input, output } from '@angular/core';
import { LucidePencil } from '@lucide/angular';
import { AdminProfile } from '../../../../core/models/profile.model';

// Una fila del listado. Se usa como atributo (<tr app-profile-row>) para no romper la tabla.
// No llama a la API: avisa al padre con outputs.
@Component({
  selector: 'tr[app-profile-row]',
  imports: [LucidePencil],
  templateUrl: './profile-row.html',
  host: { class: 'hover:bg-gris-50/70' },
})
export class ProfileRow {
  profile = input.required<AdminProfile>();
  editClick = output<AdminProfile>();

  readonly fullName = computed(() => [this.profile().firstName, this.profile().lastName].filter(Boolean).join(' '));
}
