import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `<div class="rounded-2xl border border-gris-200 bg-white px-6 py-16 text-center text-gris-500">{{ message() }}</div>`,
})
export class EmptyState {
  message = input('No hay datos todavía.');
}
