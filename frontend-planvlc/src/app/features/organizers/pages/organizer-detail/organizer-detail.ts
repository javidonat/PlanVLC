import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucidePencil } from '@lucide/angular';
import { organizerStatusLabel, organizerTypeLabel } from '../../../../core/models/organizer.model';
import { OrganizersService } from '../../../../core/services/organizers.service';
import { OrganizersStore } from '../../../../core/stores/organizers.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

// Ficha de solo lectura. Usa la lista del panel (GET /api/organizers), que incluye
// organizadores desactivados y eliminados: GET /api/organizers/:id solo devuelve activos.
@Component({
  selector: 'app-organizer-detail',
  imports: [RouterLink, LucidePencil, SkeletonLoader, ErrorState],
  templateUrl: './organizer-detail.html',
})
export class OrganizerDetail implements OnInit {
  private readonly service = inject(OrganizersService);
  private readonly store = inject(OrganizersStore);

  // :id de la URL (withComponentInputBinding en app.config.ts)
  readonly id = input.required<string>();

  readonly pageLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly organizer = computed(() => this.store.findById(this.id()) ?? null);

  readonly organizerStatusLabel = organizerStatusLabel;
  readonly organizerTypeLabel = organizerTypeLabel;

  ngOnInit(): void {
    // Al venir desde el listado el organizador ya está en el store; si se entra por URL, se carga la lista
    if (!this.store.loaded()) void this.loadPage();
  }

  async loadPage(): Promise<void> {
    try {
      this.pageLoading.set(true);
      this.loadError.set(null);
      const res = await this.service.getAll();
      this.store.setItems(res.data);
    } catch (error) {
      this.loadError.set(apiError(error).message);
    } finally {
      this.pageLoading.set(false);
    }
  }

  // Fecha de creación, modificación o borrado
  dateText(iso: string | null): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('es-ES', {
      timeZone: 'Europe/Madrid',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  }
}
