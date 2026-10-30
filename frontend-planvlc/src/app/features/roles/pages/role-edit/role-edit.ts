import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Role, RolePayload } from '../../../../core/models/role.model';
import { RolesService } from '../../../../core/services/roles.service';
import { RolesStore } from '../../../../core/stores/roles.store';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { ActiveSwitch } from '../../../../shared/components/active-switch/active-switch';
import { RoleForm } from '../../components/role-form/role-form';

@Component({
  selector: 'app-role-edit',
  imports: [RouterLink, SkeletonLoader, ErrorState, ActiveSwitch, RoleForm],
  templateUrl: './role-edit.html',
})
export class RoleEdit implements OnInit {
  private readonly service = inject(RolesService);
  private readonly store = inject(RolesStore);
  readonly router = inject(Router);

  // :id de la URL (withComponentInputBinding en app.config.ts)
  readonly id = input.required<string>();

  readonly role = signal<Role | null>(null);
  readonly pageLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string>>({});
  readonly toggling = signal(false);

  ngOnInit(): void {
    void this.loadPage();
  }

  async loadPage(): Promise<void> {
    try {
      this.pageLoading.set(true);
      this.loadError.set(null);
      // Siempre al backend (datos frescos). GET /:id solo devuelve roles activos
      const res = await this.service.getById(this.id());
      this.role.set(res.data);
    } catch (error) {
      this.loadError.set(apiError(error).message);
    } finally {
      this.pageLoading.set(false);
    }
  }

  // Desactivar desde la página de editar. El backend solo deja editar lo que está activo,
  // así que después se vuelve al listado (allí se puede volver a activar)
  async onDeactivate(): Promise<void> {
    const current = this.role();
    if (!current) return;
    try {
      this.toggling.set(true);
      const res = await this.service.setActive(current._id, false);
      this.store.upsert(res.data);
      await this.router.navigate(['/admin/roles']);
    } catch {
      // El interceptor ya muestra el error (p. ej. 409).
    } finally {
      this.toggling.set(false);
    }
  }

  async onSubmit(payload: RolePayload): Promise<void> {
    const role = this.role();
    if (!role) return;
    try {
      this.submitting.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      const res = await this.service.update(role._id, payload);
      this.store.upsert(res.data);
      await this.router.navigate(['/admin/roles']);
    } catch (error) {
      const failure = apiError(error);
      this.error.set(failure.message);
      this.serverErrors.set(fieldErrors(failure));
    } finally {
      this.submitting.set(false);
    }
  }
}
