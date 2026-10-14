import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { CambiosEvento, DatosEvento, Evento, RespuestaEvento, RespuestaListaEventos } from '../models/evento.model';

@Injectable({ providedIn: 'root' })
export class EventosService {
  private readonly api = inject(ApiService);
  private readonly path = 'eventos';

  async obtenerEventos(): Promise<Evento[]> {
    const response = await this.api.get<RespuestaListaEventos>(`${this.path}/activos`);
    return response.datos.filter(evento => evento.status === 'publicado' && !evento.deletedAt);
  }

  async obtenerTodos(): Promise<Evento[]> {
    return (await this.api.get<RespuestaListaEventos>(this.path)).datos;
  }

  async obtenerEliminados(): Promise<Evento[]> {
    return (await this.api.get<RespuestaListaEventos>(`${this.path}/eliminados`)).datos;
  }

  async obtenerEventoPorSlug(slug: string): Promise<Evento> {
    return (await this.api.get<RespuestaEvento>(`${this.path}/slug/${encodeURIComponent(slug)}`)).datos;
  }

  async obtenerEventoPorId(id: string): Promise<Evento> {
    return (await this.api.get<RespuestaEvento>(`${this.path}/${encodeURIComponent(id)}`)).datos;
  }

  async crearEvento(datos: DatosEvento): Promise<Evento> {
    return (await this.api.post<RespuestaEvento>(this.path, datos)).datos;
  }

  async modificarEvento(id: string, cambios: CambiosEvento): Promise<Evento> {
    return (await this.api.patch<RespuestaEvento>(`${this.path}/${encodeURIComponent(id)}`, cambios)).datos;
  }

  async cambiarActivo(id: string, isActive: boolean): Promise<Evento> {
    return (await this.api.patch<RespuestaEvento>(`${this.path}/${encodeURIComponent(id)}/active`, { isActive })).datos;
  }

  async eliminarEvento(id: string): Promise<Evento> {
    return (await this.api.patch<RespuestaEvento>(`${this.path}/${encodeURIComponent(id)}/softdelete`, {})).datos;
  }
}
