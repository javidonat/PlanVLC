import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RoleRef } from '../../../../core/models/role.model';
import { User, UserPayload } from '../../../../core/models/user.model';
import { RolesService } from '../../../../core/services/roles.service';
import { UsersService } from '../../../../core/services/users.service';
import { UsersStore } from '../../../../core/stores/users.store';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { ActiveSwitch } from '../../../../shared/components/active-switch/active-switch';
import { UserForm } from '../../components/user-form/user-form';

@Component({
  selector: 'app-user-edit',
  imports: [RouterLink, SkeletonLoader, ErrorState, ActiveSwitch, UserForm],
  templateUrl: './user-edit.html',
})
export class UserEdit implements OnInit {
  private readonly service = inject(UsersService);
  private readonly rolesService = inject(RolesService);
  private readonly store = inject(UsersStore);
  readonly router = inject(Router);

  // :id de la URL (withComponentInputBinding en app.config.ts)
  readonly id = input.required<string>();

  readonly user = signal<User | null>(null);
  readonly roles = signal<RoleRef[]>([]);
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
      // El usuario se pide siempre al backend (datos frescos y con el rol poblado).
      // GET /:id solo devuelve usuarios activos: uno desactivado da 404.
      const [userResponse, roles] = await Promise.all([this.service.getById(this.id()), this.rolesService.getActive()]);
      this.user.set(userResponse.data);
      this.roles.set(roles.data);
    } catch (error) {
      this.loadError.set(apiError(error).message);
    } finally {
      this.pageLoading.set(false);
    }
  }

  // Desactivar desde la página de editar. El backend solo deja editar lo que está activo,
  // así que después se vuelve al listado (allí se puede volver a activar)
  async onDeactivate(): Promise<void> {
    const current = this.user();
    if (!current) return;
    try {
      this.toggling.set(true);
      const res = await this.service.setActive(current._id, false);
      this.store.upsert(res.data);
      await this.router.navigate(['/admin/usuarios']);
    } catch {
      // El interceptor ya muestra el error (p. ej. 409).
    } finally {
      this.toggling.set(false);
    }
  }

  async onSubmit(payload: UserPayload): Promise<void> {
    const user = this.user();
    if (!user) return;
    try {
      this.submitting.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      const res = await this.service.update(user._id, payload);
      this.store.upsert(res.data);
      await this.router.navigate(['/admin/usuarios']);
    } catch (error) {
      const failure = apiError(error);
      this.error.set(failure.message);
      this.serverErrors.set(fieldErrors(failure));
    } finally {
      this.submitting.set(false);
    }
  }
}
