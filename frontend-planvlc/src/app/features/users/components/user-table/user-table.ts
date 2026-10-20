import { Component, input, output } from '@angular/core';
import { User } from '../../../../core/models/user.model';
import { UserRow } from '../user-row/user-row';

// Listado de usuarios: pinta la tabla y reenvía los eventos de cada fila al padre
@Component({
  selector: 'app-user-table',
  imports: [UserRow],
  templateUrl: './user-table.html',
})
export class UserTable {
  users = input.required<User[]>();
  busyId = input<string | null>(null);
  viewUser = output<User>();
  editUser = output<User>();
  toggleUser = output<User>();
  deleteUser = output<User>();
}
