import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucidePencil } from '@lucide/angular';
import { venueStatusLabel } from '../../../../core/models/venue.model';
import { VenuesService } from '../../../../core/services/venues.service';
import { VenuesStore } from '../../../../core/stores/venues.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

// Ficha de solo lectura. Usa la lista del panel (GET /api/venues), que incluye
// lugares desactivados y eliminados: GET /api/venues/:id solo devuelve activos.
@Component({
  selector: 'app-venue-detail',
  imports: [RouterLink, LucidePencil, SkeletonLoader, ErrorState],
  templateUrl: './venue-detail.html',
})
export class VenueDetail implements OnInit {
  private readonly service = inject(VenuesService);
  private readonly store = inject(VenuesStore);

  // :id de la URL (withComponentInputBinding en app.config.ts)
  readonly id = input.required<string>();

  readonly pageLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly venue = computed(() => this.store.findById(this.id()) ?? null);

  readonly venueStatusLabel = venueStatusLabel;

  ngOnInit(): void {
    // Al venir desde el listado el lugar ya está en el store; si se entra por URL, se carga la lista
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
