import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-mensaje-error',
  templateUrl: './mensaje-error.html',
  styleUrl: './mensaje-error.css',
})
export class MensajeError {
  mensaje = input.required<string>();
  reintentar = output<void>(); // el padre decide qué hacer al pulsar "Reintentar"
}
