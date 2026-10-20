import { Component, input, output } from '@angular/core';
import { Role } from '../../../../core/models/role.model';
import { RoleRow } from '../role-row/role-row';

// Listado de roles: pinta la tabla y reenvía los eventos de cada fila al padre
@Component({
  selector: 'app-role-table',
  imports: [RoleRow],
  templateUrl: './role-table.html',
})
export class RoleTable {
  roles = input.required<Role[]>();
  busyId = input<string | null>(null);
  viewRole = output<Role>();
  editRole = output<Role>();
  toggleRole = output<Role>();
  deleteRole = output<Role>();
}
