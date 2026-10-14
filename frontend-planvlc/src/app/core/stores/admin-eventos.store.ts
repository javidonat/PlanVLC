import { Injectable, inject, signal } from '@angular/core';
import { Evento } from '../models/evento.model';
import { EventosService } from '../services/eventos.service';
import { apiError } from '../interceptors/error.interceptor';

@Injectable({ providedIn: 'root' })
export class AdminEventosStore {
  private readonly service = inject(EventosService);
  readonly eventos = signal<Evento[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly trabajando = signal<string | null>(null);

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.eventos.set(await this.service.obtenerTodos());
    } catch (error) {
      this.error.set(apiError(error).mensaje);
    } finally {
      this.cargando.set(false);
    }
  }

  async cambiarActivo(evento: Evento): Promise<void> {
    this.trabajando.set(evento._id);
    try {
      this.replace(await this.service.cambiarActivo(evento._id, !evento.isActive));
    } finally {
      this.trabajando.set(null);
    }
  }

  async eliminar(evento: Evento): Promise<void> {
    this.trabajando.set(evento._id);
    try {
      this.replace(await this.service.eliminarEvento(evento._id));
    } finally {
      this.trabajando.set(null);
    }
  }

  replace(evento: Evento): void {
    this.eventos.update(lista => {
      const updated = lista.some(item => item._id === evento._id)
        ? lista.map(item => item._id === evento._id ? evento : item)
        : [...lista, evento];
      return updated.sort((a, b) => a.fecha.localeCompare(b.fecha));
    });
  }
}