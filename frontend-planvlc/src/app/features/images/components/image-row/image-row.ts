import { Component, input, output } from '@angular/core';
import { LucideEye, LucidePencil, LucideTrash2 } from '@lucide/angular';
import { Image, imageEntityTypeLabel, imageTypeLabel } from '../../../../core/models/image.model';

// Una fila del listado. Se usa como atributo (<tr app-image-row>) para no romper la tabla.
// No llama a la API: avisa al padre con outputs.
@Component({
  selector: 'tr[app-image-row]',
  imports: [LucideEye, LucidePencil, LucideTrash2],
  templateUrl: './image-row.html',
  host: { class: 'hover:bg-slate-50/70' },
})
export class ImageRow {
  image = input.required<Image>();
  busy = input(false);
  viewClick = output<Image>();
  editClick = output<Image>();
  toggleClick = output<Image>();
  deleteClick = output<Image>();

  readonly imageEntityTypeLabel = imageEntityTypeLabel;
  readonly imageTypeLabel = imageTypeLabel;
}
