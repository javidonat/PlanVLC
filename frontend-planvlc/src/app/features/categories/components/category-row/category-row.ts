import { Component, input, output } from '@angular/core';
import { LucideEye, LucidePencil, LucideTrash2 } from '@lucide/angular';
import { Category, categoryGroupLabel, categoryStatusLabel } from '../../../../core/models/category.model';

// Una fila del listado. Se usa como atributo (<tr app-category-row>) para no romper la tabla.
// No llama a la API: avisa al padre con outputs.
@Component({
  selector: 'tr[app-category-row]',
  imports: [LucideEye, LucidePencil, LucideTrash2],
  templateUrl: './category-row.html',
  host: { class: 'hover:bg-gris-50/70' },
})
export class CategoryRow {
  category = input.required<Category>();
  busy = input(false);
  viewClick = output<Category>();
  editClick = output<Category>();
  toggleClick = output<Category>();
  deleteClick = output<Category>();

  readonly categoryGroupLabel = categoryGroupLabel;
  readonly categoryStatusLabel = categoryStatusLabel;
}
