import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { User } from '../../../../core/models/user.model';
import { AlertService } from '../../../../core/services/alert.service';
import { UsersService } from '../../../../core/services/users.service';
import { UsersStore } from '../../../../core/stores/users.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { UserTable } from '../../components/user-table/user-table';

@Component({
  selector: 'app-user-list',
  imports: [RouterLink, LucidePlus, SkeletonLoader, EmptyState, ErrorState, UserTable],
  templateUrl: './user-list.html',
})
export class UserList implements OnInit {
  readonly store = inject(UsersStore);
  private readonly service = inject(UsersService);
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

  onView(user: User): void {
    void this.router.navigate(['/admin/usuarios', user._id]);
  }

  onEdit(user: User): void {
    void this.router.navigate(['/admin/usuarios', user._id, 'editar']);
  }

  async onToggle(user: User): Promise<void> {
    try {
      this.store.setBusy(user._id);
      const res = await this.service.setActive(user._id, !user.isActive);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error.
    } finally {
      this.store.setBusy(null);
    }
  }

  async onDelete(user: User): Promise<void> {
    const confirmed = await this.alerts.confirm('Eliminar usuario', `Se eliminará «${user.name}» y no se podrá recuperar desde el panel.`, 'Eliminar');
    if (!confirmed) return;
    try {
      this.store.setBusy(user._id);
      const res = await this.service.softDelete(user._id);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error (p. ej. 409).
    } finally {
      this.store.setBusy(null);
    }
  }
}
