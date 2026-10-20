import { Component, input, output } from '@angular/core';
import { Image } from '../../../../core/models/image.model';
import { ImageRow } from '../image-row/image-row';

// Listado de imágenes: pinta la tabla y reenvía los eventos de cada fila al padre
@Component({
  selector: 'app-image-table',
  imports: [ImageRow],
  templateUrl: './image-table.html',
})
export class ImageTable {
  images = input.required<Image[]>();
  busyId = input<string | null>(null);
  viewImage = output<Image>();
  editImage = output<Image>();
  toggleImage = output<Image>();
  deleteImage = output<Image>();
}
