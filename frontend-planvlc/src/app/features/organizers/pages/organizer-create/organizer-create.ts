import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OrganizerPayload } from '../../../../core/models/organizer.model';
import { OrganizersService } from '../../../../core/services/organizers.service';
import { OrganizersStore } from '../../../../core/stores/organizers.store';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { OrganizerForm } from '../../components/organizer-form/organizer-form';

@Component({
  selector: 'app-organizer-create',
  imports: [RouterLink, OrganizerForm],
  templateUrl: './organizer-create.html',
})
export class OrganizerCreate {
  private readonly service = inject(OrganizersService);
  private readonly store = inject(OrganizersStore);
  readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string>>({});

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
