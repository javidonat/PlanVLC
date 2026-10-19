import { Component, input, output } from '@angular/core';
import { Category } from '../../../../core/models/category.model';
import { CategoryRow } from '../category-row/category-row';

// Listado de categorías: pinta la tabla y reenvía los eventos de cada fila al padre
@Component({
  selector: 'app-category-table',
  imports: [CategoryRow],
  templateUrl: './category-table.html',
})
export class CategoryTable {
  categories = input.required<Category[]>();
  busyId = input<string | null>(null);
  viewCategory = output<Category>();
  editCategory = output<Category>();
  toggleCategory = output<Category>();
  deleteCategory = output<Category>();
}
