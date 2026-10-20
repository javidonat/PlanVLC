import { Component, input, output } from '@angular/core';
import { LucideEye, LucidePencil, LucideTrash2 } from '@lucide/angular';
import { User, userStatusLabel } from '../../../../core/models/user.model';

// Una fila del listado. Se usa como atributo (<tr app-user-row>) para no romper la tabla.
// No llama a la API: avisa al padre con outputs.
@Component({
  selector: 'tr[app-user-row]',
  imports: [LucideEye, LucidePencil, LucideTrash2],
  templateUrl: './user-row.html',
  host: { class: 'hover:bg-slate-50/70' },
})
export class UserRow {
  user = input.required<User>();
  busy = input(false);
  viewClick = output<User>();
  editClick = output<User>();
  toggleClick = output<User>();
  deleteClick = output<User>();

  readonly userStatusLabel = userStatusLabel;

  // roleId puede llegar poblado ({ _id, name }) o solo como id
  roleName(user: User): string {
    return typeof user.roleId === 'object' && user.roleId ? user.roleId.name : 'Sin rol';
  }
}
