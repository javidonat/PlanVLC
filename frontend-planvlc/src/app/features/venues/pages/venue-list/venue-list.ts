import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { Venue } from '../../../../core/models/venue.model';
import { AlertService } from '../../../../core/services/alert.service';
import { VenuesService } from '../../../../core/services/venues.service';
import { VenuesStore } from '../../../../core/stores/venues.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { VenueTable } from '../../components/venue-table/venue-table';

@Component({
  selector: 'app-venue-list',
  imports: [RouterLink, LucidePlus, SkeletonLoader, EmptyState, ErrorState, VenueTable],
  templateUrl: './venue-list.html',
})
export class VenueList implements OnInit {
  readonly store = inject(VenuesStore);
  private readonly service = inject(VenuesService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    // Si ya se cargó antes (p. ej. al volver de crear/editar) no se repite la petición
    if (!this.store.loaded()) void this.load();
  }

  async load(): Promise<void> {
    try {
      this.store.setLoading(true);
      this.store.setError(null);
      const res = await this.service.getAll();
      this.store.setItems(res.data);
    } catch (error) {
      this.store.setError(apiError(error).message);
    } finally {
      this.store.setLoading(false);
    }
  }

  onView(venue: Venue): void {
    void this.router.navigate(['/admin/lugares', venue._id]);
  }

  onEdit(venue: Venue): void {
    void this.router.navigate(['/admin/lugares', venue._id, 'editar']);
  }

  async onToggle(venue: Venue): Promise<void> {
    try {
      this.store.setBusy(venue._id);
      const res = await this.service.setActive(venue._id, !venue.isActive);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error.
    } finally {
      this.store.setBusy(null);
    }
  }

  async onDelete(venue: Venue): Promise<void> {
    const confirmed = await this.alerts.confirm('Eliminar lugar', `Se eliminará «${venue.name}» y no se podrá recuperar desde el panel.`, 'Eliminar');
    if (!confirmed) return;
    try {
      this.store.setBusy(venue._id);
      const res = await this.service.softDelete(venue._id);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error (p. ej. 409 si hay planes en el lugar).
    } finally {
      this.store.setBusy(null);
    }
  }
}
