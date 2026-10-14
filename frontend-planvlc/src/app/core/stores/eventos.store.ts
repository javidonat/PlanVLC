import { Injectable, computed, inject, signal } from '@angular/core';
import { Categoria, Evento } from '../models/evento.model';
import { EventosService } from '../services/eventos.service';
import { apiError } from '../interceptors/error.interceptor';
import { esPasado, normalizar } from '../../features/eventos/utils/eventos.utils';

export type FiltroCategoria = Categoria | 'todas';

@Injectable({ providedIn: 'root' })
export class EventosStore {
  private readonly service = inject(EventosService);
  readonly eventos = signal<Evento[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly eventoActual = signal<Evento | null>(null);
  readonly cargandoDetalle = signal(false);
  readonly errorDetalle = signal<string | null>(null);
  readonly busqueda = signal('');
  readonly categoria = signal<FiltroCategoria>('todas');
  readonly soloGratis = signal(false);
  readonly ocultarPasados = signal(false);

  readonly eventosFiltrados = computed(() => {
    const texto = normalizar(this.busqueda().trim());
    const filtrados = this.eventos().filter(e => {
      if (this.categoria() !== 'todas' && e.categoria !== this.categoria()) return false;
      if (this.soloGratis() && e.precio !== 0) return false;
      if (this.ocultarPasados() && esPasado(e.fecha)) return false;
      return !texto || normalizar(`${e.nombre} ${e.descripcion} ${e.lugar}`).includes(texto);
    });
    const proximos = filtrados.filter(e => !esPasado(e.fecha));
    const pasados = filtrados.filter(e => esPasado(e.fecha)).reverse();
    return [...proximos, ...pasados];
  });

  readonly hayFiltrosActivos = computed(() => !!this.busqueda().trim() || this.categoria() !== 'todas' || this.soloGratis() || this.ocultarPasados());

  async cargarEventos(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try { this.eventos.set(await this.service.obtenerEventos()); }
    catch (error) { this.error.set(apiError(error).mensaje); }
    finally { this.cargando.set(false); }
  }

  async cargarEvento(slug: string): Promise<void> {
    this.eventoActual.set(null);
    this.cargandoDetalle.set(true);
    this.errorDetalle.set(null);
    try { this.eventoActual.set(await this.service.obtenerEventoPorSlug(slug)); }
    catch (error) { this.errorDetalle.set(apiError(error).mensaje); }
    finally { this.cargandoDetalle.set(false); }
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.categoria.set('todas');
    this.soloGratis.set(false);
    this.ocultarPasados.set(false);
  }
}
