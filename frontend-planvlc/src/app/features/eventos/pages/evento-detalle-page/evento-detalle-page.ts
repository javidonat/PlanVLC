import { Component, OnInit, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EstadoCarga } from '../../../../shared/components/estado-carga/estado-carga';
import { MensajeError } from '../../../../shared/components/mensaje-error/mensaje-error';
import { etiquetaCategoria } from '../../../../core/models/evento.model';
import { EventosStore } from '../../../../core/stores/eventos.store';
import { diaDelMes, edadTexto, entradasTexto, esPasado, fechaLarga, mesCorto, precioTexto } from '../../utils/eventos.utils';

@Component({
  selector: 'app-evento-detalle-page',
  imports: [RouterLink, EstadoCarga, MensajeError],
  templateUrl: './evento-detalle-page.html',
  styleUrl: './evento-detalle-page.css',
})
export class EventoDetallePage implements OnInit {
  protected readonly store = inject(EventosStore);
  readonly slug = input.required<string>();
  readonly vista = computed(() => {
    const e = this.store.eventoActual();
    if (!e) return null;
    return { evento: e, dia: diaDelMes(e.fecha), mes: mesCorto(e.fecha), fecha: fechaLarga(e.fecha),
      categoria: etiquetaCategoria(e.categoria), precio: precioTexto(e.precio), edad: edadTexto(e.edadMinima),
      entradas: entradasTexto(e.entradasDisponibles), pasado: esPasado(e.fecha) };
  });

  ngOnInit(): void { void this.store.cargarEvento(this.slug()); }
  reintentar(): void { void this.store.cargarEvento(this.slug()); }
}
