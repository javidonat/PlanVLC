import { Component, input } from '@angular/core';

@Component({
  selector: 'app-estado-carga',
  templateUrl: './estado-carga.html',
  styleUrl: './estado-carga.css',
})
export class EstadoCarga {
  texto = input('Cargando…');
}
