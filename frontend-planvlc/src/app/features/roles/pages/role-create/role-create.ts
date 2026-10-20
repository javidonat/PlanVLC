import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RolePayload } from '../../../../core/models/role.model';
import { RolesService } from '../../../../core/services/roles.service';
import { RolesStore } from '../../../../core/stores/roles.store';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { RoleForm } from '../../components/role-form/role-form';

@Component({
  selector: 'app-role-create',
  imports: [RouterLink, RoleForm],
  templateUrl: './role-create.html',
})
export class RoleCreate {
  private readonly service = inject(RolesService);
  private readonly store = inject(RolesStore);
  readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string>>({});

  async onSubmit(payload: RolePayload): Promise<void> {
    try {
      this.submitting.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      const res = await this.service.create(payload);
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
