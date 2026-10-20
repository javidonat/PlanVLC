import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { Role } from '../../../../core/models/role.model';
import { AlertService } from '../../../../core/services/alert.service';
import { RolesService } from '../../../../core/services/roles.service';
import { RolesStore } from '../../../../core/stores/roles.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { RoleTable } from '../../components/role-table/role-table';

@Component({
  selector: 'app-role-list',
  imports: [RouterLink, LucidePlus, SkeletonLoader, EmptyState, ErrorState, RoleTable],
  templateUrl: './role-list.html',
})
export class RoleList implements OnInit {
  readonly store = inject(RolesStore);
  private readonly service = inject(RolesService);
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

  onView(role: Role): void {
    void this.router.navigate(['/admin/roles', role._id]);
  }

  onEdit(role: Role): void {
    void this.router.navigate(['/admin/roles', role._id, 'editar']);
  }

  async onToggle(role: Role): Promise<void> {
    try {
      this.store.setBusy(role._id);
      const res = await this.service.setActive(role._id, !role.isActive);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error.
    } finally {
      this.store.setBusy(null);
    }
  }

  async onDelete(role: Role): Promise<void> {
    const confirmed = await this.alerts.confirm('Eliminar rol', `Se eliminará «${role.name}» y no se podrá recuperar desde el panel.`, 'Eliminar');
    if (!confirmed) return;
    try {
      this.store.setBusy(role._id);
      const res = await this.service.softDelete(role._id);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error (p. ej. 409).
    } finally {
      this.store.setBusy(null);
    }
  }
}
