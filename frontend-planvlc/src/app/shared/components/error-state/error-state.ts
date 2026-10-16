import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  template: `
    <div class="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800" role="alert">
      {{ message() }}
      <button type="button" class="ml-3 font-semibold underline" (click)="retry.emit()">Reintentar</button>
    </div>
  `,
})
export class ErrorState {
  message = input('No se han podido cargar los datos.');
  retry = output<void>(); // el padre decide qué hacer al pulsar "Reintentar"
}
