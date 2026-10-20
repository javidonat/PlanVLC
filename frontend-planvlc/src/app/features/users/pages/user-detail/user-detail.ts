import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucidePencil } from '@lucide/angular';
import { User, userStatusLabel } from '../../../../core/models/user.model';
import { UsersService } from '../../../../core/services/users.service';
import { UsersStore } from '../../../../core/stores/users.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

// Ficha de solo lectura. Usa la lista del panel (GET /api/users), que incluye
// usuarios desactivados y eliminados: GET /api/users/:id solo devuelve activos.
@Component({
  selector: 'app-user-detail',
  imports: [RouterLink, LucidePencil, SkeletonLoader, ErrorState],
  templateUrl: './user-detail.html',
})
export class UserDetail implements OnInit {
  private readonly service = inject(UsersService);
  private readonly store = inject(UsersStore);

  // :id de la URL (withComponentInputBinding en app.config.ts)
  readonly id = input.required<string>();

  readonly pageLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly user = computed(() => this.store.findById(this.id()) ?? null);

  readonly userStatusLabel = userStatusLabel;

  ngOnInit(): void {
    // Al venir desde el listado el usuario ya está en el store; si se entra por URL, se carga la lista
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

  // roleId puede llegar poblado ({ _id, name }) o solo como id
  roleName(user: User): string {
    return typeof user.roleId === 'object' && user.roleId ? user.roleId.name : 'Sin rol';
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
