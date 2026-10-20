import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OrganizerPayload } from '../../../../core/models/organizer.model';
import { UserRef } from '../../../../core/models/user.model';
import { OrganizersService } from '../../../../core/services/organizers.service';
import { UsersService } from '../../../../core/services/users.service';
import { OrganizersStore } from '../../../../core/stores/organizers.store';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { OrganizerForm } from '../../components/organizer-form/organizer-form';

@Component({
  selector: 'app-organizer-create',
  imports: [RouterLink, SkeletonLoader, ErrorState, OrganizerForm],
  templateUrl: './organizer-create.html',
})
export class OrganizerCreate implements OnInit {
  private readonly service = inject(OrganizersService);
  private readonly usersService = inject(UsersService);
  private readonly store = inject(OrganizersStore);
  readonly router = inject(Router);

  readonly users = signal<UserRef[]>([]);
  readonly pageLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string>>({});

  ngOnInit(): void {
    void this.loadReferences();
  }

  // Opciones de usuarios que pueden gestionar el organizador (solo los activos)
  async loadReferences(): Promise<void> {
    try {
      this.pageLoading.set(true);
      this.loadError.set(null);
      const res = await this.usersService.getActive();
      this.users.set(res.data);
    } catch (error) {
      this.loadError.set(apiError(error).message);
    } finally {
      this.pageLoading.set(false);
    }
  }

  async onSubmit(payload: OrganizerPayload): Promise<void> {
    try {
      this.submitting.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      const res = await this.service.create(payload);
      this.store.upsert(res.data);
      await this.router.navigate(['/admin/organizadores']);
    } catch (error) {
      const failure = apiError(error);
      this.error.set(failure.message);
      this.serverErrors.set(fieldErrors(failure));
    } finally {
      this.submitting.set(false);
    }
  }
}
