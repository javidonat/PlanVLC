import { Component, input, output } from '@angular/core';
import { LucideEye, LucidePencil, LucideTrash2 } from '@lucide/angular';
import { CATEGORY_GROUPS, CATEGORY_STATUSES, Category } from '../../../../core/models/category.model';
import { optionLabel } from '../../../../shared/utils/format.utils';

// Una fila del listado. Se usa como atributo (<tr app-category-row>) para no romper la tabla.
// No llama a la API: avisa al padre con outputs.
@Component({
  selector: 'tr[app-category-row]',
  imports: [LucideEye, LucidePencil, LucideTrash2],
  templateUrl: './category-row.html',
  host: { class: 'hover:bg-slate-50/70' },
})
export class CategoryRow {
  category = input.required<Category>();
  busy = input(false);
  viewClick = output<Category>();
  editClick = output<Category>();
  toggleClick = output<Category>();
  deleteClick = output<Category>();

  readonly groupLabel = (category: Category) => optionLabel(CATEGORY_GROUPS, category.group);
  readonly statusLabel = (category: Category) => optionLabel(CATEGORY_STATUSES, category.status);
}
