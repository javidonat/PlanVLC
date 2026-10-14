import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideCalendarDays, LucideMapPin, LucidePlus, LucidePencil, LucideTrash2, LucideExternalLink } from '@lucide/angular';
import { AdminEventosStore } from '../../../../core/stores/admin-eventos.store';
import { AlertService } from '../../../../core/services/alert.service';
import { Evento, etiquetaCategoria } from '../../../../core/models/evento.model';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';

@Component({
  selector: 'app-eventos-admin',
  imports: [RouterLink, LucideCalendarDays, LucideMapPin, LucidePlus, LucidePencil, LucideTrash2, LucideExternalLink, SkeletonLoader],
  templateUrl: './eventos-admin.html',
})
export class EventosAdmin implements OnInit {
  readonly store = inject(AdminEventosStore);
  private readonly alerts = inject(AlertService);
  readonly etiquetaCategoria = etiquetaCategoria;

  ngOnInit(): void { void this.store.cargar(); }

  async toggle(evento: Evento): Promise<void> {
    try { await this.store.cambiarActivo(evento); } catch { /* Interceptor muestra el error. */ }
  }

  async eliminar(evento: Evento): Promise<void> {
    if (!await this.alerts.confirmDelete(evento.nombre)) return;
    try { await this.store.eliminar(evento); } catch { /* Interceptor muestra el error. */ }
  }

  fecha(fecha: string): string {
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(fecha));
  }
}