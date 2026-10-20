import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { Organizer } from '../../../../core/models/organizer.model';
import { AlertService } from '../../../../core/services/alert.service';
import { OrganizersService } from '../../../../core/services/organizers.service';
import { OrganizersStore } from '../../../../core/stores/organizers.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { OrganizerTable } from '../../components/organizer-table/organizer-table';

@Component({
  selector: 'app-organizer-list',
  imports: [RouterLink, LucidePlus, SkeletonLoader, EmptyState, ErrorState, OrganizerTable],
  templateUrl: './organizer-list.html',
})
export class OrganizerList implements OnInit {
  readonly store = inject(OrganizersStore);
  private readonly service = inject(OrganizersService);
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

  onView(organizer: Organizer): void {
    void this.router.navigate(['/admin/organizadores', organizer._id]);
  }

  onEdit(organizer: Organizer): void {
    void this.router.navigate(['/admin/organizadores', organizer._id, 'editar']);
  }

  async onToggle(organizer: Organizer): Promise<void> {
    try {
      this.store.setBusy(organizer._id);
      const res = await this.service.setActive(organizer._id, !organizer.isActive);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error.
    } finally {
      this.store.setBusy(null);
    }
  }

  async onDelete(organizer: Organizer): Promise<void> {
    const confirmed = await this.alerts.confirm('Eliminar organizador', `Se eliminará «${organizer.name}» y no se podrá recuperar desde el panel.`, 'Eliminar');
    if (!confirmed) return;
    try {
      this.store.setBusy(organizer._id);
      const res = await this.service.softDelete(organizer._id);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error (p. ej. 409 si tiene planes).
    } finally {
      this.store.setBusy(null);
    }
  }
}
