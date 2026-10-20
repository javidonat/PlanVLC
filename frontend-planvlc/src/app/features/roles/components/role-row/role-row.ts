import { Component, input, output } from '@angular/core';
import { LucideEye, LucidePencil, LucideTrash2 } from '@lucide/angular';
import { Role } from '../../../../core/models/role.model';

// Una fila del listado. Se usa como atributo (<tr app-role-row>) para no romper la tabla.
// No llama a la API: avisa al padre con outputs.
@Component({
  selector: 'tr[app-role-row]',
  imports: [LucideEye, LucidePencil, LucideTrash2],
  templateUrl: './role-row.html',
  host: { class: 'hover:bg-slate-50/70' },
})
export class RoleRow {
  role = input.required<Role>();
  busy = input(false);
  viewClick = output<Role>();
  editClick = output<Role>();
  toggleClick = output<Role>();
  deleteClick = output<Role>();
}
